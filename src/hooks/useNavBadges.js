import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchDueFlashcardCount } from '../lib/api/flashcards.js';
import { fetchUnresolvedFlagCount } from '../lib/api/flags.js';

export function useNavBadges() {
  const { user } = useAuth();
  const [dueCards, setDueCards] = useState(0);
  const [openFlags, setOpenFlags] = useState(0);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      fetchDueFlashcardCount(user.id)
        .then(setDueCards)
        .catch(() => setDueCards(0));
      fetchUnresolvedFlagCount(user.id)
        .then(setOpenFlags)
        .catch(() => setOpenFlags(0));
    }

    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return { dueCards, openFlags };
}
