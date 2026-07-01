/**
 * Baralhos — modelo Anki: o usuário escolhe o que estudar e quando.
 * A biblioteca futura (Duolingo) alimentará novos baralhos, não substitui estes.
 */

/** @typedef {'all'|'quests'|'stoicism'|'patterns'|'study'|'library'} FlashcardDeckFilter */

export const FLASHCARD_DECKS = {
  quests: {
    label: 'Minhas quests',
    description: 'Cards gerados das quests que você pratica.'
  },
  stoicism: {
    label: 'Estoicismo',
    description: 'Princípios e exercícios estóicos das suas quests.'
  },
  patterns: {
    label: 'Padrões A/B/C',
    description: 'Reframes dos três padrões de auto-observação.'
  },
  study: {
    label: 'Estudo livre',
    description: 'Cards que você criou para explorar outros temas.'
  },
  library: {
    label: 'Biblioteca',
    description: 'Frases e lições curadas (em breve — Fase 5).'
  }
};

/** @type {FlashcardDeckFilter[]} */
export const DECK_FILTER_ORDER = ['all', 'quests', 'stoicism', 'patterns', 'study'];

/**
 * @param {string | null | undefined} deck
 */
export function getDeckLabel(deck) {
  if (!deck) return FLASHCARD_DECKS.study.label;
  return FLASHCARD_DECKS[deck]?.label ?? deck;
}

/**
 * @param {object} quest
 * @param {object} version
 */
export function resolveDeckForQuest(quest, version) {
  const tradition = version.definition?.tradition;
  if (tradition === 'stoicism') return 'stoicism';
  if (quest.pattern_id) return 'patterns';
  if (version.definition?.presetId) return 'quests';
  return 'quests';
}

/**
 * @param {object} card
 */
export function getCardDeck(card) {
  return card.deck ?? 'study';
}

/**
 * @param {object[]} cards
 * @param {FlashcardDeckFilter} filter
 */
export function filterCardsByDeck(cards, filter) {
  if (filter === 'all') return cards;
  return cards.filter((c) => getCardDeck(c) === filter);
}

/**
 * @param {object[]} cards
 * @param {FlashcardDeckFilter} filter
 */
export function countDueInDeck(cards, filter) {
  const now = Date.now();
  return filterCardsByDeck(cards, filter).filter(
    (c) => new Date(c.next_review_at).getTime() <= now
  ).length;
}
