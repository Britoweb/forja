import { useId, useState } from 'react';
import { REVIEW_BUTTONS } from '../lib/flashcards.js';

/**
 * @param {object} props
 * @param {object} card
 * @param {boolean} props.busy
 * @param {(quality: number) => Promise<void>} props.onReview
 */
export default function FlashcardReviewSession({ card, busy, onReview }) {
  const [revealed, setRevealed] = useState(false);

  if (!card) {
    return (
      <div className="card empty-state flashcard-done">
        <p className="muted">Nenhum card para revisar agora. Volte mais tarde.</p>
      </div>
    );
  }

  function handleNextCard() {
    setRevealed(false);
  }

  async function handleReview(quality) {
    await onReview(quality);
    handleNextCard();
  }

  return (
    <article className="card flashcard-review" aria-live="polite">
      <p className="flashcard-review-kicker muted">
        {revealed ? 'Resposta' : 'Pergunta'}
      </p>
      <p className="flashcard-review-text">{revealed ? card.back : card.front}</p>

      {!revealed ? (
        <button type="button" className="btn-primary" onClick={() => setRevealed(true)}>
          Mostrar resposta
        </button>
      ) : (
        <div className="flashcard-quality-grid" role="group" aria-label="Qualidade da resposta">
          {REVIEW_BUTTONS.map((btn) => (
            <button
              key={btn.quality}
              type="button"
              className="flashcard-quality-btn"
              disabled={busy}
              onClick={() => handleReview(btn.quality)}
            >
              <span className="flashcard-quality-label">{btn.label}</span>
              <span className="flashcard-quality-hint muted">{btn.hint}</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
