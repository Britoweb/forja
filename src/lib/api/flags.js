import { getSupabase } from '../supabaseClient.js';

/**
 * @param {string} userId
 * @param {{ unresolvedOnly?: boolean }} [opts]
 */
export async function fetchFlags(userId, opts = {}) {
  let query = getSupabase()
    .from('inconsistency_flags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (opts.unresolvedOnly) {
    query = query.eq('resolved', false);
  }

  const { data, error } = await query.limit(200);
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} userId
 */
export async function fetchUnresolvedFlagCount(userId) {
  const { count, error } = await getSupabase()
    .from('inconsistency_flags')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('resolved', false);

  if (error) throw error;
  return count ?? 0;
}

/**
 * @param {string} flagId
 * @param {string} userExplanation
 */
export async function resolveFlag(flagId, userExplanation) {
  const { data, error } = await getSupabase()
    .from('inconsistency_flags')
    .update({
      resolved: true,
      user_explanation: userExplanation.trim() || null
    })
    .eq('id', flagId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * @param {string} userId
 * @param {object[]} newFlags
 * @param {object[]} existingFlags
 */
export async function insertNewFlags(userId, newFlags, existingFlags) {
  const recentKeys = new Set(
    (existingFlags ?? [])
      .filter((f) => {
        const age = Date.now() - new Date(f.created_at).getTime();
        return age < 7 * 86400000;
      })
      .map((f) => flagDedupeKey(f))
  );

  const toInsert = newFlags.filter((flag) => {
    const key = flagDedupeKey(flag);
    return !recentKeys.has(key);
  });

  if (!toInsert.length) return [];

  const rows = toInsert.map((flag) => ({
    user_id: userId,
    rule_triggered: flag.rule_triggered,
    severity: flag.severity,
    related_data: flag.related_data,
    resolved: false,
    user_explanation: null
  }));

  const { data, error } = await getSupabase().from('inconsistency_flags').insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {object} flag
 */
function flagDedupeKey(flag) {
  const rule = flag.rule_triggered ?? flag.rule;
  const entries = (flag.related_data?.related_entries ?? []).slice().sort().join('|');
  const range = flag.related_data?.date_range ?? '';
  return `${rule}::${range}::${entries}`;
}
