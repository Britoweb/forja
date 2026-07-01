import { getSupabase } from '../supabaseClient.js';

/**
 * Soma total de XP do ledger (append-only).
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function fetchTotalXp(userId) {
  const { data, error } = await getSupabase()
    .from('xp_ledger')
    .select('amount')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).reduce((acc, row) => acc + row.amount, 0);
}
