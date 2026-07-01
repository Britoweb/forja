import { fetchDetectionContext } from '../api/detectionContext.js';
import { fetchFlags, insertNewFlags } from '../api/flags.js';
import { runAllDetectionRules } from './rules.js';

/**
 * Executa regras de detecção e persiste flags novos (sem duplicar recentes).
 * @param {string} userId
 */
export async function runDetection(userId) {
  const [ctx, existingFlags] = await Promise.all([
    fetchDetectionContext(userId),
    fetchFlags(userId)
  ]);

  const proposed = runAllDetectionRules(ctx);
  const inserted = await insertNewFlags(userId, proposed, existingFlags);

  return {
    proposedCount: proposed.length,
    insertedCount: inserted.length,
    inserted
  };
}
