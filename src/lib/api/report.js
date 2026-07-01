import { fetchDetectionContext } from './detectionContext.js';
import { fetchFlags } from './flags.js';
import { fetchReflections } from './reflections.js';
import { fetchActiveQuests } from './quests.js';
import { fetchTotalXp } from './xp.js';
import {
  calculateCurrentStreak,
  filterSuccessfulCompletions,
  isQuestMiss
} from '../quests.js';
import { reflectionPlainText } from '../detection/textUtils.js';

const RULE_LABELS = {
  SUCCESS_ANOMALY: 'Taxa de sucesso anômala',
  WEAK_EVIDENCE: 'Evidência insuficiente',
  QUEST_REFLECTION_MISMATCH: 'Quest × reflexão inconsistentes',
  PATTERN_SILENCE: 'Padrão sumiu sem explicação',
  SUSPICIOUS_COMPLETION_TIME: 'Tempo de conclusão suspeito',
  ABRUPT_PATTERN_SHIFT: 'Mudança abrupta de padrão',
  GHOST_STREAK: 'Streak fantasma',
  XP_SPIKE: 'XP fora da curva',
  CLAIM_WITHOUT_SUPPORT: 'Alegação sem suporte',
  LEARNING_AVOIDANCE: 'Evitação de learning path'
};

const SEVERITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

/**
 * @param {string} userId
 * @param {{ days?: number }} [opts]
 */
export async function buildExportableReport(userId, opts = {}) {
  const days = opts.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [ctx, flags, reflections, questItems, totalXp] = await Promise.all([
    fetchDetectionContext(userId),
    fetchFlags(userId),
    fetchReflections(userId, { days }),
    fetchActiveQuests(userId),
    fetchTotalXp(userId)
  ]);

  const recentCompletions = ctx.completions.filter(
    (c) => new Date(c.completed_at) >= since
  );
  const successes = recentCompletions.filter((c) => !isQuestMiss(c));
  const misses = recentCompletions.filter((c) => isQuestMiss(c));

  const serializedFlags = flags
    .filter((f) => new Date(f.created_at) >= since)
    .map(serializeFlag);

  return {
    generated_at: new Date().toISOString(),
    period_days: days,
    summary: {
      total_xp: totalXp,
      active_quests: questItems.length,
      quest_successes: successes.length,
      quest_misses: misses.length,
      reflections: reflections.length,
      flags_total: serializedFlags.length,
      flags_unresolved: serializedFlags.filter((f) => !f.resolved).length
    },
    quests: questItems.map((item) => ({
      id: item.quest.id,
      title: item.quest.title,
      type: item.quest.quest_type,
      tier: item.version?.tier ?? 1,
      streak: item.version
        ? calculateCurrentStreak(item.completions, item.quest.quest_type)
        : 0
    })),
    reflections: reflections.map((r) => ({
      id: r.id,
      type: r.type,
      date: r.created_at,
      patterns: (r.reflection_patterns ?? []).map((rp) => rp.pattern_id),
      excerpt: reflectionPlainText(r.content).slice(0, 200)
    })),
    inconsistency_flags: serializedFlags,
    usage_note:
      'Cole este JSON em uma conversa de revisão periódica. Os flags são informativos — o sistema não julga, apenas evidencia para reflexão humana.'
  };
}

/**
 * @param {object} flag
 */
function serializeFlag(flag) {
  const data = flag.related_data ?? {};
  return {
    rule: flag.rule_triggered,
    rule_label: RULE_LABELS[flag.rule_triggered] ?? flag.rule_triggered,
    severity: flag.severity,
    severity_label: SEVERITY_LABELS[flag.severity] ?? flag.severity,
    date_range: data.date_range ?? null,
    pattern: data.pattern ?? null,
    description: data.description ?? '',
    related_entries: data.related_entries ?? [],
    suggested_question: data.suggested_question ?? null,
    resolved: flag.resolved,
    user_explanation: flag.user_explanation,
    created_at: flag.created_at
  };
}

/**
 * @param {object} report
 */
export function downloadReportJson(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `forja-relatorio-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { RULE_LABELS, SEVERITY_LABELS };
