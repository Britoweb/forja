import { getSupabase } from '../supabaseClient.js';
import { reflectionPlainText } from '../detection/textUtils.js';

/**
 * @param {string} userId
 * @param {{ days?: number, limit?: number }} [opts]
 */
export async function fetchReflections(userId, opts = {}) {
  const days = opts.days ?? 30;
  const limit = opts.limit ?? 50;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await getSupabase()
    .from('reflections')
    .select('*, reflection_patterns(pattern_id)')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} userId
 */
export async function fetchTodayReflections(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data, error } = await getSupabase()
    .from('reflections')
    .select('*, reflection_patterns(pattern_id)')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString());

  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} userId
 * @param {{ type: 'morning'|'evening', content: object, patternIds?: string[] }} input
 */
export async function createReflection(userId, input) {
  const text = reflectionPlainText(input.content);
  if (wordCountMin(text) < 10) {
    throw new Error('Escreva pelo menos 10 palavras na reflexão.');
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data: existing, error: checkError } = await getSupabase()
    .from('reflections')
    .select('id')
    .eq('user_id', userId)
    .eq('type', input.type)
    .gte('created_at', start.toISOString())
    .limit(1);

  if (checkError) throw checkError;
  if (existing?.length) {
    throw new Error(
      input.type === 'morning'
        ? 'Já existe reflexão da manhã hoje.'
        : 'Já existe reflexão da noite hoje.'
    );
  }

  const { data: reflection, error } = await getSupabase()
    .from('reflections')
    .insert({
      user_id: userId,
      type: input.type,
      content: input.content
    })
    .select()
    .single();

  if (error) throw error;

  const patternIds = input.patternIds ?? [];
  if (patternIds.length) {
    const rows = patternIds.map((patternId) => ({
      reflection_id: reflection.id,
      pattern_id: patternId
    }));
    const { error: linkError } = await getSupabase().from('reflection_patterns').insert(rows);
    if (linkError) throw linkError;
  }

  return reflection;
}

/**
 * @param {string} text
 */
function wordCountMin(text) {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
