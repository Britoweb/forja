import { useId, useState } from 'react';
import { FLASHCARD_DECKS } from '../lib/flashcardDecks.js';

const MANUAL_DECKS = ['study', 'stoicism', 'patterns'];

/**
 * @param {object} props
 * @param {object[]} props.patterns
 * @param {(input: object) => Promise<void>} props.onSubmit
 */
export default function FlashcardForm({ patterns, onSubmit }) {
  const frontId = useId();
  const backId = useId();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [patternId, setPatternId] = useState('');
  const [deck, setDeck] = useState('study');
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (front.trim().length < 3 || back.trim().length < 3) {
      setError('Frente e verso precisam de pelo menos 3 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        front: front.trim(),
        back: back.trim(),
        patternId: patternId || null,
        deck,
        source: 'manual'
      });
      setFront('');
      setBack('');
      setPatternId('');
      setDeck('study');
      setExpanded(false);
    } catch (err) {
      setError(err.message ?? 'Não foi possível criar o card.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card flashcard-form-section" aria-labelledby="new-flashcard-heading">
      <button
        type="button"
        className="quest-form-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <h2 id="new-flashcard-heading">Novo card</h2>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <form className="quest-form" onSubmit={handleSubmit}>
          <p className="muted">
            Frente = gatilho ou situação. Verso = reframe, princípio ou ação.
          </p>
          <div>
            <label htmlFor={frontId}>Frente</label>
            <textarea
              id={frontId}
              rows={2}
              required
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Ex.: Estou sendo duro comigo mesmo."
            />
          </div>
          <div>
            <label htmlFor={backId}>Verso</label>
            <textarea
              id={backId}
              rows={3}
              required
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Ex.: Trataria um amigo assim? Compaixão não é fraqueza."
            />
          </div>
          <div>
            <label htmlFor="flashcard-pattern">Padrão (opcional)</label>
            <select
              id="flashcard-pattern"
              value={patternId}
              onChange={(e) => setPatternId(e.target.value)}
            >
              <option value="">Nenhum</option>
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="flashcard-deck">Baralho</label>
            <select id="flashcard-deck" value={deck} onChange={(e) => setDeck(e.target.value)}>
              {MANUAL_DECKS.map((id) => (
                <option key={id} value={id}>
                  {FLASHCARD_DECKS[id].label}
                </option>
              ))}
            </select>
            <p className="field-hint muted">{FLASHCARD_DECKS[deck]?.description}</p>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Criando…' : 'Criar card'}
          </button>
        </form>
      )}
    </section>
  );
}
