import { getSupabase } from '../supabaseClient.js';

export const DEFAULT_PATTERNS = [
  {
    code: 'A',
    name: 'Comportamento',
    description:
      'Generalização de erro pontual em incompetência global; reatividade em conflitos; evitação de desafios.',
    target_behavior: 'Responder a falhas com especificidade, não com veredito global sobre quem sou.'
  },
  {
    code: 'B',
    name: 'Auto-flagelação',
    description:
      'Crítica interna severa; assume culpa alheia; nega-se compaixão que daria a qualquer outra pessoa.',
    target_behavior: 'Tratar a si mesmo com o mesmo rigor compassivo que aplicaria a um amigo.'
  },
  {
    code: 'C',
    name: 'Distorção cosmológica',
    description:
      'Crença implícita de que sofre de forma excepcional; cria exceções mentais às regras universais.',
    target_behavior: 'Aplicar a si mesmo as mesmas leis que aplicaria a qualquer ser humano.'
  }
];

/**
 * Mantém um padrão por código (o mais recente). Evita duplicatas no UI quando
 * trigger SQL e seed do client rodaram juntos.
 * @param {object[]} patterns
 */
export function dedupePatternsByCode(patterns) {
  const byCode = new Map();

  for (const pattern of patterns) {
    const prev = byCode.get(pattern.code);
    if (!prev || new Date(pattern.created_at) > new Date(prev.created_at)) {
      byCode.set(pattern.code, pattern);
    }
  }

  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function fetchPatterns(userId) {
  const { data, error } = await getSupabase()
    .from('patterns')
    .select('*')
    .eq('user_id', userId)
    .order('code');

  if (error) throw error;
  return dedupePatternsByCode(data ?? []);
}

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function seedDefaultPatterns(userId) {
  const existing = await fetchPatterns(userId);
  const existingCodes = new Set(existing.map((p) => p.code));
  const missing = DEFAULT_PATTERNS.filter((p) => !existingCodes.has(p.code));

  if (!missing.length) return existing;

  const { data, error } = await getSupabase()
    .from('patterns')
    .insert(
      missing.map((pattern) => ({
        user_id: userId,
        ...pattern
      }))
    )
    .select();

  if (error) throw error;
  return dedupePatternsByCode([...existing, ...(data ?? [])]);
}
