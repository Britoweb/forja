import { useState } from 'react';
import { getDeckLabel } from '../lib/flashcardDecks.js';
import { getQuestFlashcardSuggestions } from '../lib/questFlashcards.js';

/**
 * @param {object} props
 * @param {object[]} props.questItems
 * @param {object[]} props.cards
 * @param {(input: object) => Promise<{ duplicate?: boolean }>} props.onAdd
 * @param {(inputs: object[]) => Promise<{ created?: number, skipped?: number }>} [props.onAddAll]
 */
export default function QuestFlashcardSuggestions({ questItems, cards, onAdd, onAddAll }) {
  const suggestions = getQuestFlashcardSuggestions(questItems, cards);
  const [busyId, setBusyId] = useState(null);
  const [addingAll, setAddingAll] = useState(false);

  if (!suggestions.length) return null;

  async function handleAdd(suggestion, questId) {
    setBusyId(questId);
    try {
      await onAdd(suggestion);
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddAll() {
    if (!onAddAll) return;
    setAddingAll(true);
    try {
      await onAddAll(suggestions.map((s) => s.suggestion));
    } finally {
      setAddingAll(false);
    }
  }

  return (
    <section className="card quest-flashcard-suggestions" aria-labelledby="quest-cards-heading">
      <div className="section-header section-header-row">
        <div>
          <h2 id="quest-cards-heading">Cards das suas quests</h2>
          <p className="muted">
            Um card por quest — para revisar o princípio quando o hábito já está em andamento.
          </p>
        </div>
        {onAddAll && suggestions.length > 1 && (
          <button
            type="button"
            className="btn-ghost btn-ghost-sm"
            disabled={addingAll || busyId !== null}
            onClick={handleAddAll}
          >
            {addingAll ? 'Adicionando…' : `Adicionar todos (${suggestions.length})`}
          </button>
        )}
      </div>

      <ul className="quest-flashcard-list" role="list">
        {suggestions.map(({ quest, suggestion }) => {
          const isBusy = busyId === quest.id || addingAll;
          return (
            <li key={quest.id}>
              <article className="quest-flashcard-item">
                <div>
                  <h3>{quest.title}</h3>
                  <p className="quest-flashcard-front">{suggestion.front}</p>
                  <p className="quest-flashcard-back muted">{suggestion.back}</p>
                  <p className="preset-meta muted">Baralho: {getDeckLabel(suggestion.deck)}</p>
                </div>
                <button
                  type="button"
                  className="btn-primary preset-accept-btn"
                  disabled={isBusy}
                  onClick={() => handleAdd(suggestion, quest.id)}
                >
                  {busyId === quest.id ? 'Adicionando…' : 'Adicionar'}
                </button>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
