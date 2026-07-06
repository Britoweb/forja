/** @typedef {'morning'|'afternoon'|'evening'|'anytime'} QuestTimeSlot */
/** @typedef {'morning'|'day'|'evening'} QuestTimeSlotGroup */

export const QUEST_TIME_SLOTS = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite',
  anytime: 'Qualquer hora'
};

/** Ordem de exibição na lista de quests. */
export const TIME_SLOT_GROUP_ORDER = /** @type {const} */ (['morning', 'day', 'evening']);

export const TIME_SLOT_GROUP_LABELS = {
  morning: 'Manhã',
  day: 'Ao longo do dia',
  evening: 'Noite'
};

/** Hora a partir da qual quests diárias em aberto merecem atenção. */
export const DAILY_CHECKIN_HOUR = 18;

/**
 * @param {QuestTimeSlot | undefined | null} slot
 */
export function getTimeSlotLabel(slot) {
  return QUEST_TIME_SLOTS[slot ?? 'anytime'] ?? QUEST_TIME_SLOTS.anytime;
}

/**
 * Agrupa manhã / dia (tarde + qualquer hora) / noite.
 * @param {QuestTimeSlot | undefined | null} slot
 * @returns {QuestTimeSlotGroup}
 */
export function resolveTimeSlotGroup(slot) {
  if (slot === 'morning') return 'morning';
  if (slot === 'evening') return 'evening';
  return 'day';
}

/**
 * @param {object} item
 * @returns {QuestTimeSlotGroup}
 */
export function getQuestTimeSlotGroup(item) {
  const slot = item.version?.definition?.timeSlot ?? 'anytime';
  return resolveTimeSlotGroup(slot);
}

/**
 * @param {QuestTimeSlotGroup} group
 */
export function getTimeSlotGroupOrder(group) {
  const index = TIME_SLOT_GROUP_ORDER.indexOf(group);
  return index === -1 ? TIME_SLOT_GROUP_ORDER.length : index;
}

/**
 * @param {object[]} items
 * @returns {{ key: QuestTimeSlotGroup, label: string, items: object[] }[]}
 */
export function groupQuestItemsByTimeSlot(items) {
  /** @type {Record<QuestTimeSlotGroup, object[]>} */
  const buckets = { morning: [], day: [], evening: [] };

  for (const item of items) {
    buckets[getQuestTimeSlotGroup(item)].push(item);
  }

  return TIME_SLOT_GROUP_ORDER.filter((key) => buckets[key].length > 0).map((key) => ({
    key,
    label: TIME_SLOT_GROUP_LABELS[key],
    items: buckets[key]
  }));
}
