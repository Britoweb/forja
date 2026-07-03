/** Cache em memória para evitar tela vazia ao remontar a página de quests. */

/** @type {{ userId: string | null, items: object[] | null }} */
const cache = { userId: null, items: null };

/**
 * @param {string} userId
 * @returns {object[] | null}
 */
export function getCachedQuests(userId) {
  if (cache.userId === userId && cache.items) return cache.items;
  return null;
}

/**
 * @param {string} userId
 * @param {object[]} items
 */
export function setCachedQuests(userId, items) {
  cache.userId = userId;
  cache.items = items;
}

export function clearQuestCache() {
  cache.userId = null;
  cache.items = null;
}
