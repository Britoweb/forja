import { flushPendingSync } from './db.js';
import { getSupabase, isSupabaseConfigured } from './supabaseClient.js';

export function initSync() {
  if (!isSupabaseConfigured) return;

  const run = () => {
    flushPendingSync(getSupabase()).catch((err) => {
      console.error('Falha na sincronização offline:', err);
    });
  };

  window.addEventListener('online', run);
  if (navigator.onLine) {
    run();
  }
}
