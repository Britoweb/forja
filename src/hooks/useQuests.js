import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  completeQuest,
  createQuest,
  deactivateQuest,
  fetchActiveQuests,
  recalibrateQuest
} from '../lib/api/quests.js';
import { queueForSync } from '../lib/db.js';
import { xpForCompletion } from '../lib/quests.js';

/**
 * @returns {object}
 */
export function useQuests() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evolutionNotice, setEvolutionNotice] = useState(null);

  const reload = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const data = await fetchActiveQuests(user.id);
      setItems(data);
    } catch (err) {
      setError(err.message ?? 'Erro ao carregar quests.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addQuest = useCallback(
    async (input) => {
      if (!user) return;
      await createQuest(user.id, input);
      await reload();
    },
    [user, reload]
  );

  const complete = useCallback(
    async ({ quest, version, completions, evidenceText, openedAt }) => {
      if (!user) return null;

      if (!navigator.onLine) {
        const xpAmount = xpForCompletion(quest.quest_type, version.tier);
        await queueForSync('quest_completion_bundle', {
          completion: {
            quest_version_id: version.id,
            user_id: user.id,
            opened_at: openedAt,
            completed_at: new Date().toISOString(),
            evidence: { text: evidenceText },
            xp_awarded: xpAmount,
            flagged: false
          },
          xpEntry: {
            user_id: user.id,
            source_type: 'quest',
            amount: xpAmount
          }
        });
        await reload();
        return { offline: true };
      }

      const result = await completeQuest({
        userId: user.id,
        quest,
        version,
        completions,
        evidenceText,
        openedAt
      });

      if (result.evolved && result.evolution) {
        setEvolutionNotice(result.evolution);
      }

      await reload();
      return result;
    },
    [user, reload]
  );

  const recalibrate = useCallback(
    async (quest, version) => {
      await recalibrateQuest(quest, version);
      await reload();
    },
    [reload]
  );

  const removeQuest = useCallback(
    async (questId) => {
      await deactivateQuest(questId);
      await reload();
    },
    [reload]
  );

  const dismissEvolution = useCallback(() => setEvolutionNotice(null), []);

  return {
    items,
    loading,
    error,
    evolutionNotice,
    reload,
    addQuest,
    complete,
    recalibrate,
    removeQuest,
    dismissEvolution
  };
}
