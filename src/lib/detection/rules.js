import {
  calculateCurrentStreak,
  filterSuccessfulCompletions,
  isQuestMiss
} from '../quests.js';
import {
  hasNegativeMarkers,
  hasSpecificity,
  mean,
  reflectionPlainText,
  stdDev,
  toDateKey,
  wordCount
} from './textUtils.js';

/**
 * @typedef {object} ProposedFlag
 * @property {string} rule_triggered
 * @property {'low'|'medium'|'high'} severity
 * @property {object} related_data
 */

/**
 * @param {import('../api/detectionContext.js').fetchDetectionContext extends (...args: any) => Promise<infer R> ? R : never} ctx
 * @returns {ProposedFlag[]}
 */
export function runAllDetectionRules(ctx) {
  const flags = [];
  flags.push(...detectSuccessAnomaly(ctx));
  flags.push(...detectWeakEvidence(ctx));
  flags.push(...detectQuestReflectionMismatch(ctx));
  flags.push(...detectPatternSilence(ctx));
  flags.push(...detectSuspiciousCompletionTime(ctx));
  flags.push(...detectAbruptPatternShift(ctx));
  flags.push(...detectGhostStreak(ctx));
  flags.push(...detectXpSpike(ctx));
  flags.push(...detectClaimWithoutSupport(ctx));
  return flags;
}

/**
 * @param {ReturnType<typeof import('../api/detectionContext.js').fetchDetectionContext> extends Promise<infer R> ? R : never} ctx
 */
function detectSuccessAnomaly(ctx) {
  const successful = ctx.completions.filter((c) => !isQuestMiss(c));
  if (successful.length < 20) return [];

  const last60 = successful.slice(0, 60);
  const dailyRates = buildDailySuccessRates(last60, 60);
  if (dailyRates.length < 14) return [];

  const baseline = mean(dailyRates);
  const deviation = stdDev(dailyRates);
  const last7Rates = buildDailySuccessRates(successful, 7);
  const currentWindow = mean(last7Rates);

  if (currentWindow <= baseline + 2 * deviation) return [];

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);

  return [
    {
      rule_triggered: 'SUCCESS_ANOMALY',
      severity: 'medium',
      related_data: {
        date_range: `${toDateKey(start)} to ${toDateKey(end)}`,
        description: `Taxa de sucesso dos últimos 7 dias (${Math.round(currentWindow * 100)}%) está acima da sua linha de base histórica (${Math.round(baseline * 100)}% ± ${Math.round(deviation * 100)}%).`,
        related_entries: [],
        pattern: null
      }
    }
  ];
}

/**
 * @param {object[]} completions
 * @param {number} days
 */
function buildDailySuccessRates(completions, days) {
  const rates = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i += 1) {
    const key = toDateKey(cursor);
    const dayCompletions = completions.filter((c) => toDateKey(new Date(c.completed_at)) === key);
    const successes = dayCompletions.filter((c) => !isQuestMiss(c)).length;
    const total = dayCompletions.length;
    rates.push(total > 0 ? successes / total : successes > 0 ? 1 : 0);
    cursor.setDate(cursor.getDate() - 1);
  }

  return rates.filter((_, idx) => idx < days);
}

function detectWeakEvidence(ctx) {
  const flags = [];

  for (const completion of ctx.completions) {
    if (isQuestMiss(completion)) continue;
    const text = completion.evidence?.text;
    if (!text?.trim()) continue;

    const words = wordCount(text);
    if (words >= 15 || hasSpecificity(text)) continue;

    const questTitle = completion.quest_versions?.quests?.title ?? 'Quest';

    flags.push({
      rule_triggered: 'WEAK_EVIDENCE',
      severity: 'low',
      related_data: {
        date_range: toDateKey(new Date(completion.completed_at)),
        description: `Evidência da quest "${questTitle}" tem poucas palavras (${words}) e pouca especificidade (sem números, datas ou nomes).`,
        related_entries: [`quest_completion:${completion.id}`],
        pattern: null
      }
    });
  }

  return flags;
}

function detectQuestReflectionMismatch(ctx) {
  const flags = [];
  const patternById = Object.fromEntries(ctx.patterns.map((p) => [p.id, p]));
  const eveningByDay = {};

  for (const reflection of ctx.reflections) {
    if (reflection.type !== 'evening') continue;
    const day = toDateKey(new Date(reflection.created_at));
    eveningByDay[day] = reflection;
  }

  for (const completion of ctx.completions) {
    if (isQuestMiss(completion)) continue;
    const patternId = completion.quest_versions?.quests?.pattern_id;
    if (!patternId) continue;

    const day = toDateKey(new Date(completion.completed_at));
    const evening = eveningByDay[day];
    if (!evening) continue;

    const patternIds = (evening.reflection_patterns ?? []).map((rp) => rp.pattern_id);
    if (!patternIds.includes(patternId)) continue;

    const text = reflectionPlainText(evening.content);
    if (!hasNegativeMarkers(text)) continue;

    const pattern = patternById[patternId];
    const questTitle = completion.quest_versions?.quests?.title ?? 'Quest';

    flags.push({
      rule_triggered: 'QUEST_REFLECTION_MISMATCH',
      severity: 'high',
      related_data: {
        date_range: day,
        pattern: pattern?.name ?? 'Padrão',
        description: `Quest "${questTitle}" marcada como sucesso, mas a reflexão noturna do mesmo dia menciona dificuldade com o padrão ${pattern?.code ?? ''} (${pattern?.name ?? ''}).`,
        related_entries: [
          `quest_completion:${completion.id}`,
          `reflection:${evening.id}`
        ]
      }
    });
  }

  return flags;
}

function detectPatternSilence(ctx) {
  const flags = [];
  const now = new Date();

  for (const pattern of ctx.patterns) {
    if (pattern.status === 'consolidated') continue;

    const mentions8w = countPatternMentions(ctx.reflections, pattern.id, 56, now);
    const mentions2w = countPatternMentions(ctx.reflections, pattern.id, 14, now);

    const historicalPerWeek = mentions8w / 8;
    const recentPerWeek = mentions2w / 2;

    if (historicalPerWeek < 1 || recentPerWeek > 0) continue;

    flags.push({
      rule_triggered: 'PATTERN_SILENCE',
      severity: 'medium',
      related_data: {
        date_range: `últimas 2 semanas`,
        pattern: pattern.name,
        description: `O padrão ${pattern.code} (${pattern.name}) era mencionado ~${historicalPerWeek.toFixed(1)}x/semana e sumiu nas últimas 2 semanas.`,
        related_entries: [],
        suggested_question:
          'Você parou de ter esse padrão, ou parou de registrar?'
      }
    });
  }

  return flags;
}

/**
 * @param {object[]} reflections
 * @param {string} patternId
 * @param {number} daysBack
 * @param {Date} now
 */
function countPatternMentions(reflections, patternId, daysBack, now) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - daysBack);

  return reflections.filter((r) => {
    if (new Date(r.created_at) < cutoff) return false;
    return (r.reflection_patterns ?? []).some((rp) => rp.pattern_id === patternId);
  }).length;
}

function detectSuspiciousCompletionTime(ctx) {
  const flags = [];

  for (const completion of ctx.completions) {
    if (isQuestMiss(completion)) continue;
    if (!completion.opened_at) continue;

    const quest = completion.quest_versions?.quests;
    const definition = completion.quest_versions?.definition ?? {};
    const combined = `${quest?.title ?? ''} ${definition.target ?? ''} ${definition.validation ?? ''}`.toLowerCase();

    const isDeepReflection =
      combined.includes('reflex') ||
      combined.includes('min') ||
      (completion.quest_versions?.tier >= 2 && quest?.category === 'intellectual');

    if (!isDeepReflection) continue;

    const elapsed =
      (new Date(completion.completed_at).getTime() - new Date(completion.opened_at).getTime()) /
      1000;

    if (elapsed >= 90) continue;

    flags.push({
      rule_triggered: 'SUSPICIOUS_COMPLETION_TIME',
      severity: 'low',
      related_data: {
        date_range: toDateKey(new Date(completion.completed_at)),
        pattern: null,
        description: `Quest "${quest?.title ?? 'Quest'}" (reflexão/profunda) concluída em ${Math.round(elapsed)}s — abaixo do tempo esperado.`,
        related_entries: [`quest_completion:${completion.id}`]
      }
    });
  }

  return flags;
}

function detectAbruptPatternShift(ctx) {
  const flags = [];
  const now = new Date();

  for (const pattern of ctx.patterns) {
    const prevWeek = patternBrokenRate(ctx.reflections, pattern.id, 14, 7, now);
    const thisWeek = patternBrokenRate(ctx.reflections, pattern.id, 7, 0, now);

    if (prevWeek.sample < 2 && thisWeek.sample < 2) continue;

    const diff = Math.abs(thisWeek.rate - prevWeek.rate);
    if (diff <= 0.25) continue;

    flags.push({
      rule_triggered: 'ABRUPT_PATTERN_SHIFT',
      severity: 'medium',
      related_data: {
        date_range: 'últimas 2 semanas',
        pattern: pattern.name,
        description: `Mudança abrupta no padrão ${pattern.code}: taxa de menções "difíceis" passou de ${Math.round(prevWeek.rate * 100)}% para ${Math.round(thisWeek.rate * 100)}% em uma semana.`,
        related_entries: [],
        suggested_question: 'Houve mudança real de comportamento ou de registro?'
      }
    });
  }

  return flags;
}

/**
 * @param {object[]} reflections
 * @param {string} patternId
 * @param {number} daysBackStart
 * @param {number} daysBackEnd
 * @param {Date} now
 */
function patternBrokenRate(reflections, patternId, daysBackStart, daysBackEnd, now) {
  const start = new Date(now);
  start.setDate(start.getDate() - daysBackStart);
  const end = new Date(now);
  end.setDate(end.getDate() - daysBackEnd);

  const inWindow = reflections.filter((r) => {
    const d = new Date(r.created_at);
    return d >= start && d < end;
  });

  const withPattern = inWindow.filter((r) =>
    (r.reflection_patterns ?? []).some((rp) => rp.pattern_id === patternId)
  );

  if (!withPattern.length) return { rate: 0, sample: 0 };

  const broken = withPattern.filter((r) => hasNegativeMarkers(reflectionPlainText(r.content))).length;
  return { rate: broken / withPattern.length, sample: withPattern.length };
}

function detectGhostStreak(ctx) {
  const flags = [];
  const freezeQuestIds = new Set((ctx.streakFreezes ?? []).map((f) => f.quest_id));
  const cutoff48h = Date.now() - 48 * 3600000;

  for (const item of ctx.questItems) {
    const { quest, version, completions } = item;
    if (!version || freezeQuestIds.has(quest.id)) continue;

    const streak = calculateCurrentStreak(completions, quest.quest_type);
    if (streak <= 0) continue;

    const recentSuccess = filterSuccessfulCompletions(completions).some(
      (c) => new Date(c.completed_at).getTime() >= cutoff48h
    );

    if (recentSuccess) continue;

    flags.push({
      rule_triggered: 'GHOST_STREAK',
      severity: 'low',
      related_data: {
        date_range: toDateKey(new Date()),
        pattern: null,
        description: `Quest "${quest.title}" mostra streak ${streak}, mas não há completion de sucesso nas últimas 48h.`,
        related_entries: [`quest:${quest.id}`]
      }
    });
  }

  return flags;
}

function detectXpSpike(ctx) {
  const dailyXp = {};
  for (const entry of ctx.xpEntries) {
    const day = toDateKey(new Date(entry.created_at));
    dailyXp[day] = (dailyXp[day] ?? 0) + entry.amount;
  }

  const days = Object.keys(dailyXp).sort();
  if (days.length < 14) return [];

  const today = toDateKey(new Date());
  const xpToday = dailyXp[today] ?? 0;
  const historical = days.filter((d) => d !== today).map((d) => dailyXp[d]);
  const avg = mean(historical);

  if (avg <= 0 || xpToday <= avg * 3) return [];

  return [
    {
      rule_triggered: 'XP_SPIKE',
      severity: 'low',
      related_data: {
        date_range: today,
        pattern: null,
        description: `XP de hoje (${xpToday}) é mais de 3× sua média diária (${Math.round(avg)}).`,
        related_entries: []
      }
    }
  ];
}

function detectClaimWithoutSupport(ctx) {
  const flags = [];
  const nameRegex = /\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]{2,}\b/g;
  const allTexts = [];

  for (const completion of ctx.completions) {
    const text = completion.evidence?.text;
    if (text) {
      allTexts.push({
        id: `quest_completion:${completion.id}`,
        text,
        date: new Date(completion.completed_at)
      });
    }
  }

  for (const reflection of ctx.reflections) {
    const text = reflectionPlainText(reflection.content);
    if (text) {
      allTexts.push({
        id: `reflection:${reflection.id}`,
        text,
        date: new Date(reflection.created_at)
      });
    }
  }

  for (const entry of allTexts) {
    const names = [...new Set(entry.text.match(nameRegex) ?? [])];
    for (const name of names) {
      const corroborations = allTexts.filter((other) => {
        if (other.id === entry.id) return false;
        const daysApart = Math.abs(other.date - entry.date) / 86400000;
        if (daysApart > 14) return false;
        return other.text.includes(name);
      });

      if (corroborations.length > 0) continue;

      flags.push({
        rule_triggered: 'CLAIM_WITHOUT_SUPPORT',
        severity: 'low',
        related_data: {
          date_range: toDateKey(entry.date),
          pattern: null,
          description: `Menção a "${name}" sem outras entradas nos últimos 14 dias que corroborem ou contextualizem — não significa que seja falso, só falta triangulação.`,
          related_entries: [entry.id]
        }
      });
    }
  }

  return flags;
}
