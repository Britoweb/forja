import { countDueInDeck, DECK_FILTER_ORDER, FLASHCARD_DECKS, filterCardsByDeck } from '../lib/flashcardDecks.js';

/**
 * @param {object} props
 * @param {import('../lib/flashcardDecks.js').FlashcardDeckFilter} props.value
 * @param {object[]} props.cards
 * @param {(deck: import('../lib/flashcardDecks.js').FlashcardDeckFilter) => void} props.onChange
 */
export default function FlashcardDeckFilter({ value, cards, onChange }) {
  return (
    <div className="deck-filter" role="tablist" aria-label="Filtrar baralho">
      {DECK_FILTER_ORDER.map((deckId) => {
        const label = deckId === 'all' ? 'Todos' : FLASHCARD_DECKS[deckId]?.label ?? deckId;
        const due = countDueInDeck(cards, deckId);
        const total = filterCardsByDeck(cards, deckId).length;
        const active = value === deckId;

        return (
          <button
            key={deckId}
            type="button"
            role="tab"
            aria-selected={active}
            className={`deck-filter-btn ${active ? 'deck-filter-btn--active' : ''}`}
            onClick={() => onChange(deckId)}
          >
            <span>{label}</span>
            {deckId !== 'all' && total > 0 && (
              <span className="deck-filter-meta muted">
                {due > 0 ? `${due} devido` : total}
              </span>
            )}
            {deckId === 'all' && due > 0 && (
              <span className="deck-filter-badge">{due > 9 ? '9+' : due}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
