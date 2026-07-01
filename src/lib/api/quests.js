import {
  buildEvolvedDefinition,
  evaluatePeriod,
  expectedCompletionsInWindow,
  getVersionPeriodDays,
  getVersionPeriodStart,
  xpForCompletion
} from '../quests.js';
import { getSuccessThreshold } from '../habitFrameworks.js';
import { getSupabase } from '../supabaseClient.js';

/**
 * @typedef {object} QuestWithVersion
 * @property {object} quest
 * @property {object} version
 * @property {object[]} completions
 */

/**
 * @param {string} userId
 * @returns {Promise<QuestWithVersion[]>}
 */
export async function fetchActiveQuests(userId) {
  const { data: quests, error: questsError } = await getSupabase()
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (questsError) throw questsError;
  if (!quests?.length) return [];

  const questIds = quests.map((q) => q.id);
  const { data: versions, error: versionsError } = await getSupabase()
    .from('quest_versions')
    .select('*')
    .in('quest_id', questIds)
    .is('ended_at', null);

  if (versionsError) throw versionsError;

  const versionIds = (versions ?? []).map((v) => v.id);
  if (!versionIds.length) {
    return quests.map((quest) => ({ quest, version: null, completions: [] }));
  }

  const { data: completions, error: completionsError } = await getSupabase()
    .from('quest_completions')
    .select('*')
    .in('quest_version_id', versionIds)
    .order('completed_at', { ascending: false });

  if (completionsError) throw completionsError;

  const versionByQuest = Object.fromEntries((versions ?? []).map((v) => [v.quest_id, v]));
  const completionsByVersion = (completions ?? []).reduce((acc, c) => {
    if (!acc[c.quest_version_id]) acc[c.quest_version_id] = [];
    acc[c.quest_version_id].push(c);
    return acc;
  }, {});

  return quests.map((quest) => {
    const version = versionByQuest[quest.id] ?? null;
    return {
      quest,
      version,
      completions: version ? completionsByVersion[version.id] ?? [] : []
    };
  });
}

/**
 * @param {string} userId
 * @param {object} input
 */
export async function createQuest(userId, input) {
  const { data: quest, error: questError } = await getSupabase()
    .from('quests')
    .insert({
      user_id: userId,
      title: input.title,
      category: input.category,
      quest_type: input.questType,
      pattern_id: input.patternId || null
    })
    .select()
    .single();

  if (questError) throw questError;

  const { data: version, error: versionError } = await getSupabase()
    .from('quest_versions')
    .insert({
      quest_id: quest.id,
      tier: 1,
      definition: {
        target: input.target,
        validation: input.validation ?? null,
        framework: input.framework ?? 'custom',
        timeSlot: input.timeSlot ?? 'anytime',
        wakeDependent: Boolean(input.wakeDependent),
        presetId: input.presetId ?? null,
        tradition: input.tradition ?? null,
        source: input.source ?? null,
        ...(input.frameworkFields && Object.keys(input.frameworkFields).length
          ? { frameworkFields: input.frameworkFields }
          : {})
      },
      streak_required_to_evolve: input.streakRequired ?? 28
    })
    .select()
    .single();

  if (versionError) throw versionError;

  return { quest, version };
}

/**
 * @param {object} params
 * @returns {Promise<{ completion: object, xpEntry: object, evolved: boolean, evolution?: object }>}
 */
export async function completeQuest({
  userId,
  quest,
  version,
  completions,
  evidenceText,
  openedAt
}) {
  const xpAmount = xpForCompletion(quest.quest_type, version.tier);
  const completedAt = new Date().toISOString();

  const completionPayload = {
    quest_version_id: version.id,
    user_id: userId,
    opened_at: openedAt,
    completed_at: completedAt,
    evidence: { text: evidenceText },
    xp_awarded: xpAmount,
    flagged: false
  };

  const { data: completion, error: completionError } = await getSupabase()
    .from('quest_completions')
    .insert(completionPayload)
    .select()
    .single();

  if (completionError) throw completionError;

  const xpPayload = {
    user_id: userId,
    source_type: 'quest',
    source_id: completion.id,
    amount: xpAmount
  };

  const { data: xpEntry, error: xpError } = await getSupabase()
    .from('xp_ledger')
    .insert(xpPayload)
    .select()
    .single();

  if (xpError) throw xpError;

  return { completion, xpEntry, evolved: false };
}

/**
 * @param {object} params
 */
export async function recordQuestMiss({ userId, quest, version, reasonCode, reasonLabel }) {
  const today = new Date().toDateString();

  const { data: todayRows, error: checkError } = await getSupabase()
    .from('quest_completions')
    .select('id, evidence, completed_at')
    .eq('quest_version_id', version.id)
    .gte('completed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

  if (checkError) throw checkError;

  const hasEntryToday = (todayRows ?? []).some(
    (row) => new Date(row.completed_at).toDateString() === today
  );

  if (hasEntryToday) {
    throw new Error('Já existe um registro para esta quest hoje.');
  }

  const { data: miss, error: missError } = await getSupabase()
    .from('quest_completions')
    .insert({
      quest_version_id: version.id,
      user_id: userId,
      completed_at: new Date().toISOString(),
      evidence: {
        type: 'miss',
        reasonCode,
        reasonLabel,
        timeSlot: version.definition?.timeSlot ?? 'anytime',
        wakeDependent: version.definition?.wakeDependent ?? false
      },
      xp_awarded: 0,
      flagged: false
    })
    .select()
    .single();

  if (missError) throw missError;

  return { miss, questTitle: quest.title };
}

/**
 * @param {object} quest
 * @param {object} version
 * @param {object[]} completions
 */
export async function acceptPeriodEvolution(quest, version, completions) {
  const evaluation = evaluatePeriod(completions, quest, version);
  if (!evaluation.canEvolve) {
    throw new Error('Esta quest ainda não atingiu os critérios para evoluir.');
  }
  return evolveQuestVersion(quest, version);
}

/**
 * Recomeça o ciclo no mesmo tier com novo período.
 * @param {object} quest
 * @param {object} version
 */
export async function restartQuestPeriod(quest, version) {
  const now = new Date().toISOString();

  const { error: closeError } = await getSupabase()
    .from('quest_versions')
    .update({ ended_at: now })
    .eq('id', version.id);

  if (closeError) throw closeError;

  const restarts = (version.definition?.periodRestartCount ?? 0) + 1;
  const definition = {
    ...version.definition,
    periodRestartCount: restarts
  };

  const { data: newVersion, error: createError } = await getSupabase()
    .from('quest_versions')
    .insert({
      quest_id: quest.id,
      tier: version.tier,
      definition,
      streak_required_to_evolve: version.streak_required_to_evolve
    })
    .select()
    .single();

  if (createError) throw createError;

  return {
    questTitle: quest.title,
    tier: version.tier,
    newVersion,
    restartCount: restarts
  };
}

/**
 * @param {object} quest
 * @param {object} version
 */
async function evolveQuestVersion(quest, version) {
  const nextTier = version.tier + 1;
  const now = new Date().toISOString();

  const { error: closeError } = await getSupabase()
    .from('quest_versions')
    .update({ ended_at: now })
    .eq('id', version.id);

  if (closeError) throw closeError;

  const newDefinition = buildEvolvedDefinition(version.definition, nextTier, quest.quest_type);

  const { data: newVersion, error: createError } = await getSupabase()
    .from('quest_versions')
    .insert({
      quest_id: quest.id,
      tier: nextTier,
      definition: newDefinition,
      streak_required_to_evolve: version.streak_required_to_evolve
    })
    .select()
    .single();

  if (createError) throw createError;

  return {
    previousTier: version.tier,
    newTier: nextTier,
    newVersion,
    questTitle: quest.title
  };
}

/**
 * @param {object} quest
 * @param {object} version
 */
export async function recalibrateQuest(quest, version) {
  if (version.tier <= 1) return null;

  const now = new Date().toISOString();
  const previousTier = version.tier - 1;

  const { error: closeError } = await getSupabase()
    .from('quest_versions')
    .update({ ended_at: now })
    .eq('id', version.id);

  if (closeError) throw closeError;

  const { data: priorVersions, error: priorError } = await getSupabase()
    .from('quest_versions')
    .select('*')
    .eq('quest_id', quest.id)
    .eq('tier', previousTier)
    .order('started_at', { ascending: false })
    .limit(1);

  if (priorError) throw priorError;

  const priorDefinition = priorVersions?.[0]?.definition ?? version.definition;

  const { data: newVersion, error: createError } = await getSupabase()
    .from('quest_versions')
    .insert({
      quest_id: quest.id,
      tier: previousTier,
      definition: priorDefinition,
      streak_required_to_evolve: version.streak_required_to_evolve
    })
    .select()
    .single();

  if (createError) throw createError;

  return { newVersion, previousTier: version.tier, newTier: previousTier };
}

/**
 * @param {string} questId
 */
export async function deactivateQuest(questId) {
  const { error } = await getSupabase().from('quests').update({ active: false }).eq('id', questId);
  if (error) throw error;
}

/**
 * Apenas desenvolvimento — retrocede o início do ciclo e opcionalmente simula conclusões.
 * @param {object} quest
 * @param {object} version
 * @param {string} userId
 * @param {{ passed?: boolean }} [options]
 */
export async function simulatePeriodReviewForDev(quest, version, userId, options = {}) {
  if (!import.meta.env.DEV) {
    throw new Error('Simulação disponível apenas em desenvolvimento.');
  }

  const passed = options.passed ?? true;
  const periodDays = getVersionPeriodDays(version);
  const simulatedStart = new Date();
  simulatedStart.setHours(0, 0, 0, 0);
  simulatedStart.setDate(simulatedStart.getDate() - periodDays - 1);

  const { error: startError } = await getSupabase()
    .from('quest_versions')
    .update({ started_at: simulatedStart.toISOString() })
    .eq('id', version.id);

  if (startError) throw startError;

  const { error: clearError } = await getSupabase()
    .from('quest_completions')
    .delete()
    .eq('quest_version_id', version.id);

  if (clearError) throw clearError;

  const expected = expectedCompletionsInWindow(quest.quest_type, periodDays);
  const threshold = getSuccessThreshold(version.definition?.framework);
  const targetCount = passed
    ? Math.ceil(expected * threshold)
    : Math.max(0, Math.ceil(expected * threshold) - 1);

  if (targetCount <= 0) {
    return { periodDays, expected, targetCount, passed };
  }

  const periodStart = getVersionPeriodStart({ ...version, started_at: simulatedStart.toISOString() });
  const xpAmount = xpForCompletion(quest.quest_type, version.tier);
  const rows = [];

  for (let i = 0; i < targetCount; i += 1) {
    const completedAt = new Date(periodStart);

    if (quest.quest_type === 'weekly') {
      completedAt.setDate(completedAt.getDate() + i * 7);
    } else if (quest.quest_type === 'monthly') {
      completedAt.setMonth(completedAt.getMonth() + i);
    } else {
      const dayOffset =
        targetCount === 1 ? 0 : Math.floor((i * Math.max(periodDays - 1, 0)) / (targetCount - 1));
      completedAt.setDate(completedAt.getDate() + dayOffset);
    }

    completedAt.setHours(12, 0, 0, 0);

    rows.push({
      quest_version_id: version.id,
      user_id: userId,
      completed_at: completedAt.toISOString(),
      evidence: { text: `[dev] conclusão simulada (${passed ? 'aprovado' : 'reprovado'})` },
      xp_awarded: xpAmount,
      flagged: false
    });
  }

  const { error: seedError } = await getSupabase().from('quest_completions').insert(rows);
  if (seedError) throw seedError;

  return { periodDays, expected, targetCount, passed };
}
