import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  acceptPeriodEvolution,
  completeQuest,
  createQuest,
  deactivateQuest,
  fetchActiveQuests,
  recalibrateQuest,
  recordQuestMiss,
  restartQuestPeriod,
  simulatePeriodReviewForDev
} from '../lib/api/quests.js';
import { queueForSync } from '../lib/db.js';
import { evaluatePeriod, needsPeriodReview, xpForCompletion } from '../lib/quests.js';

/**
 * @returns {object}
 */
export function useQuests() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evolutionNotice, setEvolutionNotice] = useState(null);
  const [periodReview, setPeriodReview] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [dismissedReviewVersionIds, setDismissedReviewVersionIds] = useState(() => new Set());
  const [missDialog, setMissDialog] = useState(null);

  const syncPeriodReview = useCallback((data, dismissed) => {
    const pending = data.find(
      (item) =>
        item.version &&
        !dismissed.has(item.version.id) &&
        needsPeriodReview(item.completions, item.quest, item.version)
    );

    if (!pending) {
      setPeriodReview(null);
      return;
    }

    setPeriodReview({
      quest: pending.quest,
      version: pending.version,
      completions: pending.completions,
      evaluation: evaluatePeriod(pending.completions, pending.quest, pending.version)
    });
  }, []);

  const reload = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const data = await fetchActiveQuests(user.id);
      setItems(data);
      syncPeriodReview(data, dismissedReviewVersionIds);
    } catch (err) {
      setError(err.message ?? 'Erro ao carregar quests.');
    } finally {
      setLoading(false);
    }
  }, [user, dismissedReviewVersionIds, syncPeriodReview]);

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

  const dismissPeriodReview = useCallback(() => {
    if (!periodReview?.version?.id) return;
    setDismissedReviewVersionIds((prev) => new Set(prev).add(periodReview.version.id));
    setPeriodReview(null);
  }, [periodReview]);

  const acceptEvolution = useCallback(async () => {
    if (!periodReview) return;
    setReviewBusy(true);
    try {
      const evolution = await acceptPeriodEvolution(
        periodReview.quest,
        periodReview.version,
        periodReview.completions
      );
      setPeriodReview(null);
      setEvolutionNotice(evolution);
      await reload();
    } finally {
      setReviewBusy(false);
    }
  }, [periodReview, reload]);

  const restartPeriod = useCallback(async () => {
    if (!periodReview) return;
    setReviewBusy(true);
    try {
      await restartQuestPeriod(periodReview.quest, periodReview.version);
      setDismissedReviewVersionIds((prev) => {
        const next = new Set(prev);
        next.delete(periodReview.version.id);
        return next;
      });
      setPeriodReview(null);
      await reload();
    } finally {
      setReviewBusy(false);
    }
  }, [periodReview, reload]);

  const archiveFromReview = useCallback(async () => {
    if (!periodReview) return;
    setReviewBusy(true);
    try {
      await deactivateQuest(periodReview.quest.id);
      setPeriodReview(null);
      await reload();
    } finally {
      setReviewBusy(false);
    }
  }, [periodReview, reload]);

  const simulatePeriodReview = useCallback(
    async (quest, version, passed) => {
      if (!user) return;
      setReviewBusy(true);
      try {
        await simulatePeriodReviewForDev(quest, version, user.id, { passed });
        setDismissedReviewVersionIds((prev) => {
          const next = new Set(prev);
          next.delete(version.id);
          return next;
        });
        await reload();
      } finally {
        setReviewBusy(false);
      }
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

  const openMissDialog = useCallback((item) => {
    if (!item?.quest || !item?.version) return;
    setMissDialog({
      quest: item.quest,
      version: item.version,
      completions: item.completions
    });
  }, []);

  const closeMissDialog = useCallback(() => setMissDialog(null), []);

  const recordMiss = useCallback(
    async (reason) => {
      if (!user || !missDialog) return;
      await recordQuestMiss({
        userId: user.id,
        quest: missDialog.quest,
        version: missDialog.version,
        reasonCode: reason.code,
        reasonLabel: reason.label
      });
      setMissDialog(null);
      await reload();
    },
    [user, missDialog, reload]
  );

  return {
    items,
    loading,
    error,
    evolutionNotice,
    periodReview,
    reviewBusy,
    reload,
    addQuest,
    complete,
    recalibrate,
    removeQuest,
    dismissEvolution,
    dismissPeriodReview,
    acceptEvolution,
    restartPeriod,
    archiveFromReview,
    simulatePeriodReview,
    missDialog,
    openMissDialog,
    closeMissDialog,
    recordMiss
  };
}
