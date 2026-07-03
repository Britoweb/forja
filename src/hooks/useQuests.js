import { useCallback, useEffect, useRef, useState } from 'react';
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
import { getCachedQuests, setCachedQuests } from '../lib/questCache.js';
import { queueForSync } from '../lib/db.js';
import { evaluatePeriod, needsPeriodReview, xpForCompletion } from '../lib/quests.js';

/**
 * @returns {object}
 */
export function useQuests() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const initialCache = userId ? getCachedQuests(userId) : null;

  const [items, setItems] = useState(() => initialCache ?? []);
  const [loading, setLoading] = useState(() => !initialCache);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [evolutionNotice, setEvolutionNotice] = useState(null);
  const [periodReview, setPeriodReview] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [dismissedReviewVersionIds, setDismissedReviewVersionIds] = useState(() => new Set());
  const [missDialog, setMissDialog] = useState(null);
  const hasLoadedRef = useRef(Boolean(initialCache));
  const dismissedRef = useRef(dismissedReviewVersionIds);
  dismissedRef.current = dismissedReviewVersionIds;

  const syncPeriodReview = useCallback((data) => {
    const dismissed = dismissedRef.current;
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

  const applyItems = useCallback(
    (data) => {
      setItems(data);
      if (userId) setCachedQuests(userId, data);
      syncPeriodReview(data);
    },
    [userId, syncPeriodReview]
  );

  const reload = useCallback(
    async ({ silent = false } = {}) => {
      if (!userId) return;

      if (silent && hasLoadedRef.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const data = await fetchActiveQuests(userId);
        applyItems(data);
        hasLoadedRef.current = true;
      } catch (err) {
        setError(err.message ?? 'Erro ao carregar quests.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, applyItems]
  );

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    const cached = getCachedQuests(userId);
    if (cached) {
      setItems(cached);
      hasLoadedRef.current = true;
      setLoading(false);
      reload({ silent: true });
      return;
    }

    reload();
  }, [userId, reload]);

  const addQuest = useCallback(
    async (input) => {
      if (!userId) return;
      await createQuest(userId, input);
      await reload({ silent: true });
    },
    [userId, reload]
  );

  const complete = useCallback(
    async ({ quest, version, completions, evidenceText, openedAt }) => {
      if (!userId) return null;

      const xpAmount = xpForCompletion(quest.quest_type, version.tier);
      const completedAt = new Date().toISOString();
      const optimisticCompletion = {
        id: `optimistic-${quest.id}`,
        quest_version_id: version.id,
        user_id: userId,
        opened_at: openedAt,
        completed_at: completedAt,
        evidence: { text: evidenceText },
        xp_awarded: xpAmount,
        flagged: false
      };

      setItems((prev) => {
        const next = prev.map((item) =>
          item.quest.id === quest.id
            ? { ...item, completions: [optimisticCompletion, ...item.completions] }
            : item
        );
        if (userId) setCachedQuests(userId, next);
        return next;
      });

      if (!navigator.onLine) {
        await queueForSync('quest_completion_bundle', {
          completion: {
            quest_version_id: version.id,
            user_id: userId,
            opened_at: openedAt,
            completed_at: completedAt,
            evidence: { text: evidenceText },
            xp_awarded: xpAmount,
            flagged: false
          },
          xpEntry: {
            user_id: userId,
            source_type: 'quest',
            amount: xpAmount
          }
        });
        await reload({ silent: true });
        return { offline: true };
      }

      try {
        const result = await completeQuest({
          userId,
          quest,
          version,
          completions,
          evidenceText,
          openedAt
        });

        if (result.evolved && result.evolution) {
          setEvolutionNotice(result.evolution);
        }

        await reload({ silent: true });
        return result;
      } catch (err) {
        await reload({ silent: true });
        throw err;
      }
    },
    [userId, reload]
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
      await reload({ silent: true });
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
      await reload({ silent: true });
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
      await reload({ silent: true });
    } finally {
      setReviewBusy(false);
    }
  }, [periodReview, reload]);

  const simulatePeriodReview = useCallback(
    async (quest, version, passed) => {
      if (!userId) return;
      setReviewBusy(true);
      try {
        await simulatePeriodReviewForDev(quest, version, userId, { passed });
        setDismissedReviewVersionIds((prev) => {
          const next = new Set(prev);
          next.delete(version.id);
          return next;
        });
        await reload({ silent: true });
      } finally {
        setReviewBusy(false);
      }
    },
    [userId, reload]
  );

  const recalibrate = useCallback(
    async (quest, version) => {
      await recalibrateQuest(quest, version);
      await reload({ silent: true });
    },
    [reload]
  );

  const removeQuest = useCallback(
    async (questId) => {
      await deactivateQuest(questId);
      await reload({ silent: true });
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
      if (!userId || !missDialog) return;

      const { quest, version } = missDialog;
      const optimisticMiss = {
        id: `optimistic-miss-${quest.id}`,
        quest_version_id: version.id,
        user_id: userId,
        completed_at: new Date().toISOString(),
        evidence: {
          type: 'miss',
          reasonCode: reason.code,
          reasonLabel: reason.label
        },
        xp_awarded: 0,
        flagged: false
      };

      setItems((prev) => {
        const next = prev.map((item) =>
          item.quest.id === quest.id
            ? { ...item, completions: [optimisticMiss, ...item.completions] }
            : item
        );
        if (userId) setCachedQuests(userId, next);
        return next;
      });

      try {
        await recordQuestMiss({
          userId,
          quest,
          version,
          reasonCode: reason.code,
          reasonLabel: reason.label
        });
        setMissDialog(null);
        await reload({ silent: true });
      } catch (err) {
        await reload({ silent: true });
        throw err;
      }
    },
    [userId, missDialog, reload]
  );

  return {
    items,
    loading,
    refreshing,
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
