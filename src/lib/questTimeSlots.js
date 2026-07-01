/** @typedef {'morning'|'afternoon'|'evening'|'anytime'} QuestTimeSlot */

export const QUEST_TIME_SLOTS = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite',
  anytime: 'Qualquer hora'
};

/** Hora a partir da qual quests diárias em aberto merecem atenção. */
export const DAILY_CHECKIN_HOUR = 18;

/**
 * @param {QuestTimeSlot | undefined | null} slot
 */
export function getTimeSlotLabel(slot) {
  return QUEST_TIME_SLOTS[slot ?? 'anytime'] ?? QUEST_TIME_SLOTS.anytime;
}
