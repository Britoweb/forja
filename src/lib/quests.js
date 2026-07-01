/**
 * Regras de negócio de quests — streaks, evolução de tier, XP.
 * Ver docs/SPEC.md seção 5.
 */

import { getPeriodDays, getSuccessThreshold } from './habitFrameworks.js';

export const QUEST_CATEGORIES = {
  physical: 'Físico',
  relational: 'Relacional',
  intellectual: 'Intelectual',
  pattern_specific: 'Padrão específico'
};

export const QUEST_TYPES = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal'
};

export const TIER_LABELS = {
  1: 'Formação',
  2: 'Consolidação',
  3: 'Maestria'
};

const XP_BASE = { daily: 10, weekly: 25, monthly: 50 };

/**
 * @param {object} completion
 */
export function isQuestMiss(completion) {
  return completion.evidence?.type === 'miss';
}

/**
 * @param {object[]} completions
 */
export function filterSuccessfulCompletions(completions) {
  return completions.filter((c) => !isQuestMiss(c));
}

/**
 * @param {object[]} completions
 */
export function hasCompletionToday(completions) {
  const today = new Date().toDateString();
  return filterSuccessfulCompletions(completions).some(
    (c) => new Date(c.completed_at).toDateString() === today
  );
}

/**
 * @param {object[]} completions
 */
export function hasMissToday(completions) {
  const today = new Date().toDateString();
  return completions.some(
    (c) => isQuestMiss(c) && new Date(c.completed_at).toDateString() === today
  );
}

/**
 * @param {object} quest
 * @param {object[]} completions
 */
export function isDailyPendingToday(quest, completions) {
  if (quest.quest_type !== 'daily') return false;
  return !hasCompletionToday(completions) && !hasMissToday(completions);
}

/**
 * @param {object} version
 * @param {import('./habitFrameworks.js').HabitFrameworkId | undefined | null} [frameworkId]
 */
export function resolveFrameworkId(version, frameworkId) {
  return frameworkId ?? version.definition?.framework ?? 'custom';
}

/**
 * @param {object} version
 * @param {import('./habitFrameworks.js').HabitFrameworkId | undefined | null} [frameworkId]
 */
export function getVersionPeriodDays(version, frameworkId) {
  const id = resolveFrameworkId(version, frameworkId);
  return getPeriodDays(id, version.tier, version.streak_required_to_evolve);
}

/**
 * @param {object} version
 */
export function getVersionPeriodStart(version) {
  const start = new Date(version.started_at);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * @param {object} version
 * @param {import('./habitFrameworks.js').HabitFrameworkId | undefined | null} [frameworkId]
 */
export function getVersionPeriodEnd(version, frameworkId) {
  const end = getVersionPeriodStart(version);
  end.setDate(end.getDate() + getVersionPeriodDays(version, frameworkId));
  return end;
}

/**
 * @param {object} version
 * @param {import('./habitFrameworks.js').HabitFrameworkId | undefined | null} [frameworkId]
 * @param {Date} [now]
 */
export function isPeriodEnded(version, frameworkId, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today >= getVersionPeriodEnd(version, frameworkId);
}

/**
 * @param {object} version
 * @param {import('./habitFrameworks.js').HabitFrameworkId | undefined | null} [frameworkId]
 * @param {Date} [now]
 */
export function daysRemainingInPeriod(version, frameworkId, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const end = getVersionPeriodEnd(version, frameworkId);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
}

/**
 * Avalia o ciclo atual da quest (do started_at até o fim do período).
 * @param {object[]} completions
 * @param {object} quest
 * @param {object} version
 * @param {Date} [now]
 */
export function evaluatePeriod(completions, quest, version, now = new Date()) {
  const frameworkId = resolveFrameworkId(version);
  const periodDays = getVersionPeriodDays(version, frameworkId);
  const threshold = getSuccessThreshold(frameworkId);
  const periodStart = getVersionPeriodStart(version);
  const ended = isPeriodEnded(version, frameworkId, now);

  const { rate, actual, expected } = completionRateInWindow(
    completions,
    quest.quest_type,
    periodDays,
    periodStart
  );

  const passed = rate >= threshold;
  const atMastery = version.tier >= 3;

  return {
    frameworkId,
    periodDays,
    threshold,
    rate,
    actual,
    expected,
    passed,
    ended,
    periodStart,
    periodEnd: getVersionPeriodEnd(version, frameworkId),
    daysRemaining: daysRemainingInPeriod(version, frameworkId, now),
    status: !ended ? 'in_progress' : passed ? 'passed' : 'failed',
    canEvolve: ended && passed && !atMastery,
    canRestart: ended && !passed,
    atMastery: ended && passed && atMastery
  };
}

/**
 * Ciclo encerrado e aguardando decisão do usuário.
 * @param {object[]} completions
 * @param {object} quest
 * @param {object} version
 */
export function needsPeriodReview(completions, quest, version) {
  const evaluation = evaluatePeriod(completions, quest, version);
  return evaluation.ended && (evaluation.canEvolve || evaluation.canRestart || evaluation.atMastery);
}

/**
 * @param {'daily'|'weekly'|'monthly'} questType
 * @param {number} windowDays
 */
export function expectedCompletionsInWindow(questType, windowDays) {
  switch (questType) {
    case 'weekly':
      return Math.max(1, Math.floor(windowDays / 7));
    case 'monthly':
      return Math.max(1, Math.floor(windowDays / 30));
    default:
      return windowDays;
  }
}

/**
 * @param {object[]} completions
 * @param {'daily'|'weekly'|'monthly'} questType
 * @param {number} windowDays
 * @param {Date} windowStart
 */
export function completionRateInWindow(completions, questType, windowDays, windowStart) {
  const expected = expectedCompletionsInWindow(questType, windowDays);
  const startMs = windowStart.getTime();
  const actual = filterSuccessfulCompletions(completions).filter(
    (c) => new Date(c.completed_at).getTime() >= startMs
  ).length;

  return {
    rate: expected > 0 ? actual / expected : 0,
    actual,
    expected
  };
}

/**
 * @deprecated Use evaluatePeriod + needsPeriodReview. Mantido para compatibilidade interna.
 */
export function isEligibleForEvolution(completions, quest, version) {
  const evaluation = evaluatePeriod(completions, quest, version);
  return evaluation.canEvolve;
}

/**
 * @param {Date} date
 */
function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * @param {object[]} completions
 * @param {'daily'|'weekly'|'monthly'} questType
 */
export function calculateCurrentStreak(completions, questType) {
  const successful = filterSuccessfulCompletions(completions);
  if (!successful.length) return 0;

  const sorted = [...successful].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );

  if (questType === 'daily') {
    const daySet = new Set(sorted.map((c) => toDateKey(new Date(c.completed_at))));
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    const todayKey = toDateKey(cursor);
    const yesterday = new Date(cursor);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!daySet.has(todayKey) && !daySet.has(toDateKey(yesterday))) {
      return 0;
    }

    if (!daySet.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (daySet.has(toDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  if (questType === 'weekly') {
    const weekKeys = new Set(
      sorted.map((c) => {
        const d = new Date(c.completed_at);
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${week}`;
      })
    );

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 104; i += 1) {
      const jan1 = new Date(cursor.getFullYear(), 0, 1);
      const week = Math.ceil(((cursor - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      const key = `${cursor.getFullYear()}-W${week}`;

      if (weekKeys.has(key)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 7);
      } else if (i === 0) {
        cursor.setDate(cursor.getDate() - 7);
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  const monthSet = new Set(
    sorted.map((c) => {
      const d = new Date(c.completed_at);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 24; i += 1) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    if (monthSet.has(key)) {
      streak += 1;
      cursor.setMonth(cursor.getMonth() - 1);
    } else if (i === 0) {
      cursor.setMonth(cursor.getMonth() - 1);
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * @param {'daily'|'weekly'|'monthly'} questType
 * @param {number} tier
 */
export function xpForCompletion(questType, tier) {
  return (XP_BASE[questType] ?? 10) * tier;
}

/**
 * @param {object} definition
 * @param {number} nextTier
 * @param {'daily'|'weekly'|'monthly'} questType
 */
export function buildEvolvedDefinition(definition, nextTier, questType) {
  const target = definition.target ?? '';
  const upgrades = {
    2: {
      daily: `${target} — registrar evidência específica`,
      weekly: `${target} — aumentar frequência ou intensidade`,
      monthly: `${target} — aprofundar registro mensal`
    },
    3: {
      daily: `${target} — maestria: evidência com métrica ou nome`,
      weekly: `${target} — maestria: progressão documentada`,
      monthly: `${target} — maestria: consolidação com reflexão`
    }
  };

  return {
    ...definition,
    target: upgrades[nextTier]?.[questType] ?? `${target} (Tier ${nextTier})`,
    validation:
      nextTier >= 2
        ? 'Incluir data, número ou nome próprio na evidência'
        : definition.validation ?? null
  };
}

/**
 * Tier 2+ com ≥2 dias perdidos na última semana (quests diárias).
 * @param {object[]} completions
 * @param {'daily'|'weekly'|'monthly'} questType
 * @param {number} tier
 */
export function shouldOfferRecalibration(completions, questType, tier) {
  if (tier < 2) return false;

  if (questType === 'daily') {
    const daySet = new Set(completions.map((c) => toDateKey(new Date(c.completed_at))));
    let missed = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i += 1) {
      if (!daySet.has(toDateKey(cursor))) missed += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return missed >= 2;
  }

  if (questType === 'weekly') {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 7);
    const { actual } = completionRateInWindow(completions, questType, 7, windowStart);
    return actual === 0;
  }

  return false;
}

/**
 * Progresso em direção à meta do ciclo (0–1).
 * @param {object[]} completions
 * @param {object} quest
 * @param {object} version
 */
export function evolutionProgress(completions, quest, version) {
  const evaluation = evaluatePeriod(completions, quest, version);
  if (evaluation.threshold <= 0) return 0;
  return Math.min(1, evaluation.rate / evaluation.threshold);
}
