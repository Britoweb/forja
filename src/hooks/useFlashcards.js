import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  createFlashcard,
  deleteFlashcard,
  fetchDueFlashcardCount,
  fetchFlashcards,
  reviewFlashcard
} from '../lib/api/flashcards.js';
import { queueForSync } from '../lib/db.js';
import { sm2 } from '../lib/sm2.js';

/**
 * @returns {object}
 */
export function useFlashcards() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [allCards, due] = await Promise.all([
        fetchFlashcards(user.id),
        fetchDueFlashcardCount(user.id)
      ]);
      setCards(allCards);
      setDueCount(due);
    } catch (err) {
      setError(err.message ?? 'Erro ao carregar flashcards.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addCard = useCallback(
    async (input) => {
      if (!user) return { duplicate: false };
      const result = await createFlashcard(user.id, input);
      await reload();
      return result;
    },
    [user, reload]
  );

  const addCards = useCallback(
    async (inputs) => {
      if (!user || !inputs.length) return { created: 0, skipped: 0 };
      let created = 0;
      let skipped = 0;

      for (const input of inputs) {
        const result = await createFlashcard(user.id, input);
        if (result.duplicate) skipped += 1;
        else created += 1;
      }
      await reload();
      return { created, skipped };
    },
    [user, reload]
  );

  const addStarterCards = useCallback(
    async (starters, patterns) => {
      if (!user) return;
      const patternByCode = Object.fromEntries(patterns.map((p) => [p.code, p.id]));

      for (const starter of starters) {
        await createFlashcard(user.id, {
          front: starter.front,
          back: starter.back,
          patternId: starter.patternCode ? patternByCode[starter.patternCode] : null,
          deck: 'patterns',
          source: starter.source
        });
      }
      await reload();
    },
    [user, reload]
  );

  const review = useCallback(
    async (card, quality) => {
      if (!user) return;

      setReviewing(true);
      try {
        if (!navigator.onLine) {
          const sm2Result = sm2(
            {
              easeFactor: Number(card.ease_factor),
              intervalDays: card.interval_days,
              repetitions: card.repetitions
            },
            quality
          );

          await queueForSync('flashcard_review_bundle', {
            review: {
              flashcard_id: card.id,
              user_id: user.id,
              quality
            },
            cardUpdate: {
              id: card.id,
              ease_factor: sm2Result.easeFactor,
              interval_days: sm2Result.intervalDays,
              repetitions: sm2Result.repetitions,
              next_review_at: sm2Result.nextReviewAt
            }
          });
        } else {
          await reviewFlashcard(user.id, card, quality);
        }
        await reload();
      } finally {
        setReviewing(false);
      }
    },
    [user, reload]
  );

  const removeCard = useCallback(
    async (cardId) => {
      await deleteFlashcard(cardId);
      await reload();
    },
    [reload]
  );

  const dueCards = cards.filter((c) => new Date(c.next_review_at).getTime() <= Date.now());

  return {
    cards,
    dueCards,
    dueCount,
    loading,
    error,
    reviewing,
    reload,
    addCard,
    addCards,
    addStarterCards,
    review,
    removeCard
  };
}
