/**
 * Remove todos os flashcards de quests do usuário autenticado.
 *
 * Uso:
 *   FORJA_EMAIL=seu@email.com FORJA_PASSWORD='***' node scripts/delete-quest-flashcards.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

function isQuestGeneratedCard(card) {
  if (card.quest_id) return true;
  if (card.source === 'quest_generated') return true;
  if (card.preset_id) return true;
  if (card.front?.trim().toLowerCase().startsWith('pratico:')) return true;
  return false;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const email = process.env.FORJA_EMAIL;
const password = process.env.FORJA_PASSWORD;

if (!url || !anonKey) {
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env');
  process.exit(1);
}

if (!email || !password) {
  console.error('Defina FORJA_EMAIL e FORJA_PASSWORD para autenticar.');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) {
  console.error('Login falhou:', authError.message);
  process.exit(1);
}

const userId = (await supabase.auth.getUser()).data.user?.id;
if (!userId) {
  console.error('Usuário não autenticado.');
  process.exit(1);
}

const { data: cards, error: fetchError } = await supabase
  .from('flashcards')
  .select('*')
  .eq('user_id', userId);

if (fetchError) {
  console.error('Erro ao listar cards:', fetchError.message);
  process.exit(1);
}

const toRemove = (cards ?? []).filter(isQuestGeneratedCard);

if (!toRemove.length) {
  console.log('Nenhum card de quest para remover.');
  process.exit(0);
}

console.log(`Removendo ${toRemove.length} card(s) de quests…`);
toRemove.forEach((c) => console.log(`  - ${c.front.slice(0, 60)}`));

const ids = toRemove.map((c) => c.id);
const { error: deleteError } = await supabase.from('flashcards').delete().in('id', ids);

if (deleteError) {
  console.error('Erro ao remover:', deleteError.message);
  process.exit(1);
}

console.log(`✓ ${toRemove.length} card(s) removido(s). Padrões A/B/C e estudo livre mantidos.`);
