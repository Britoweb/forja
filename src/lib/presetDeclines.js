const STORAGE_KEY = 'forja_declined_quest_presets';

/**
 * @returns {string[]}
 */
export function getDeclinedPresetIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} presetId
 */
export function declinePreset(presetId) {
  const ids = getDeclinedPresetIds();
  if (ids.includes(presetId)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, presetId]));
}

/**
 * @param {string} presetId
 */
export function restoreDeclinedPreset(presetId) {
  const ids = getDeclinedPresetIds().filter((id) => id !== presetId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
