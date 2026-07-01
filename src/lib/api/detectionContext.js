import { fetchActiveQuests } from './quests.js';
import { fetchPatterns } from './patterns.js';
import { getSupabase } from '../supabaseClient.js';

/**
 * @param {string} userId
 */
export async function fetchDetectionContext(userId) {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceIso = since.toISOString();

  const [
    completionsResult,
    reflectionsResult,
    patterns,
    xpResult,
    questItems,
    freezesResult
  ] = await Promise.all([
    getSupabase()
      .from('quest_completions')
      .select(
        `
        *,
        quest_versions (
          id, tier, definition, quest_id, started_at,
          quests ( id, title, quest_type, pattern_id, category )
        )
      `
      )
      .eq('user_id', userId)
      .gte('completed_at', sinceIso)
      .order('completed_at', { ascending: false }),
    getSupabase()
      .from('reflections')
      .select('*, reflection_patterns(pattern_id)')
      .eq('user_id', userId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
    fetchPatterns(userId),
    getSupabase()
      .from('xp_ledger')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
    fetchActiveQuests(userId),
    getSupabase().from('streak_freezes').select('*').eq('user_id', userId)
  ]);

  if (completionsResult.error) throw completionsResult.error;
  if (reflectionsResult.error) throw reflectionsResult.error;
  if (xpResult.error) throw xpResult.error;
  if (freezesResult.error) throw freezesResult.error;

  return {
    completions: completionsResult.data ?? [],
    reflections: reflectionsResult.data ?? [],
    patterns,
    xpEntries: xpResult.data ?? [],
    questItems,
    streakFreezes: freezesResult.data ?? []
  };
}
