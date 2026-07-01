import {
  buildEvolvedDefinition,
  isEligibleForEvolution,
  xpForCompletion
} from '../quests.js';
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
        validation: input.validation ?? null
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

  const allCompletions = [completion, ...completions];
  const eligible = isEligibleForEvolution(
    allCompletions,
    quest.quest_type,
    version.streak_required_to_evolve,
    version.tier
  );

  if (!eligible) {
    return { completion, xpEntry, evolved: false };
  }

  const evolution = await evolveQuestVersion(quest, version);
  return { completion, xpEntry, evolved: true, evolution };
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
