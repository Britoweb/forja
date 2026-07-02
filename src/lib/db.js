// Banco local (IndexedDB via Dexie) — fila de escrita offline-first.
// Registros aqui esperam sincronização com o Supabase quando a conexão volta.
// Ver docs/SPEC.md secão 10 (PWA / Offline-first) para a lógica de sync.

import Dexie from 'dexie';

export const db = new Dexie('forja-local');

db.version(1).stores({
  // Fila genérica de mutações pendentes de sincronizar.
  // type: 'quest_completion' | 'reflection' | 'flashcard_review' | ...
  pendingSync: '++id, type, createdAt, synced'
});

/**
 * Enfileira uma escrita local para sincronizar depois.
 * Chame isso sempre que o usuário salvar algo offline.
 */
export async function queueForSync(type, payload) {
  return db.pendingSync.add({
    type,
    payload,
    createdAt: new Date().toISOString(),
    synced: false
  });
}

/**
 * Tenta sincronizar tudo que está pendente. Chame ao reconectar
 * (window.addEventListener('online', ...)) e também periodicamente.
 * A implementação de cada `case` deve chamar o supabase client
 * correspondente e marcar synced=true em caso de sucesso.
 */
export async function flushPendingSync(supabase) {
  // Boolean false não é chave válida em IDBKeyRange em alguns navegadores — usar filter.
  const pending = await db.pendingSync.filter((item) => item.synced !== true).toArray();

  for (const item of pending) {
    try {
      switch (item.type) {
        case 'quest_completion':
          await supabase.from('quest_completions').insert(item.payload);
          break;
        case 'quest_completion_bundle': {
          const { data: completion, error: completionError } = await supabase
            .from('quest_completions')
            .insert(item.payload.completion)
            .select()
            .single();
          if (completionError) throw completionError;
          await supabase.from('xp_ledger').insert({
            ...item.payload.xpEntry,
            source_id: completion.id
          });
          break;
        }
        case 'reflection':
          await supabase.from('reflections').insert(item.payload);
          break;
        case 'flashcard_review':
          await supabase.from('flashcard_reviews').insert(item.payload);
          break;
        case 'flashcard_review_bundle': {
          await supabase.from('flashcard_reviews').insert(item.payload.review);
          await supabase
            .from('flashcards')
            .update({
              ease_factor: item.payload.cardUpdate.ease_factor,
              interval_days: item.payload.cardUpdate.interval_days,
              repetitions: item.payload.cardUpdate.repetitions,
              next_review_at: item.payload.cardUpdate.next_review_at
            })
            .eq('id', item.payload.cardUpdate.id);
          break;
        }
        default:
          console.warn('Tipo de sync desconhecido:', item.type);
          continue;
      }
      await db.pendingSync.update(item.id, { synced: true });
    } catch (err) {
      console.error('Falha ao sincronizar item', item.id, err);
      // deixa synced=false para tentar de novo na próxima passada
    }
  }
}
