import { flushPendingSync } from './db.js';
import { getSupabase, isSupabaseConfigured } from './supabaseClient.js';

export function initSync() {
  if (!isSupabaseConfigured) return;

  const run = () => flushPendingSync(getSupabase());

  window.addEventListener('online', run);
  if (navigator.onLine) {
    run();
  }
}
