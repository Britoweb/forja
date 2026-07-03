import { useEffect, useMemo, useState } from 'react';
import QuestPresetSuggestions from '../components/QuestPresetSuggestions.jsx';
import EvolutionNotice from '../components/EvolutionNotice.jsx';
import PeriodReviewDialog from '../components/PeriodReviewDialog.jsx';
import QuestCard from '../components/QuestCard.jsx';
import QuestForm from '../components/QuestForm.jsx';
import QuestMissDialog from '../components/QuestMissDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFlashcards } from '../hooks/useFlashcards.js';
import { useQuests } from '../hooks/useQuests.js';
import { fetchPatterns, seedDefaultPatterns } from '../lib/api/patterns.js';
import { buildFlashcardFromQuest, hasCardForQuestItem } from '../lib/questFlashcards.js';
import {
  getDailyQuestProgress,
  getQuestDisplayBucket,
  sortQuestItemsForDisplay
} from '../lib/quests.js';

export default function QuestsPage() {
  const { user } = useAuth();
  const {
    items,
    loading,
    refreshing,
    error,
    evolutionNotice,
    periodReview,
    reviewBusy,
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
  } = useQuests();
  const { cards, addCard } = useFlashcards();
  const [patterns, setPatterns] = useState([]);

  const sortedItems = useMemo(() => sortQuestItemsForDisplay(items), [items]);
  const dailyProgress = useMemo(() => getDailyQuestProgress(items), [items]);

  const pendingItems = useMemo(
    () => sortedItems.filter((item) => getQuestDisplayBucket(item) === 'pending_today'),
    [sortedItems]
  );
  const otherItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        const bucket = getQuestDisplayBucket(item);
        return bucket === 'recurring' || bucket === 'missed_today';
      }),
    [sortedItems]
  );
  const doneTodayItems = useMemo(
    () => sortedItems.filter((item) => getQuestDisplayBucket(item) === 'done_today'),
    [sortedItems]
  );

  async function handleCreateFlashcard(quest, version) {
    await addCard(buildFlashcardFromQuest(quest, version));
  }

  useEffect(() => {
    if (!user) return;

    seedDefaultPatterns(user.id)
      .then(() => fetchPatterns(user.id))
      .then(setPatterns)
      .catch(() => {});
  }, [user]);

  async function handleRemove(questId) {
    if (!window.confirm('Arquivar esta quest? Ela deixará de aparecer na lista.')) return;
    await removeQuest(questId);
  }

  function renderQuestCard(item) {
    return (
      <QuestCard
        item={item}
        dayStatus={getQuestDisplayBucket(item)}
        onComplete={complete}
        onRecalibrate={recalibrate}
        onRemove={handleRemove}
        onSimulatePeriodReview={simulatePeriodReview}
        onOpenMiss={openMissDialog}
        onRecordMiss={recordMiss}
        hasLinkedCard={hasCardForQuestItem(cards, item.quest, item.version)}
        onCreateFlashcard={handleCreateFlashcard}
      />
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="screen-center" role="status" aria-live="polite">
        <p className="muted">Carregando quests…</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="screen-center">
        <p className="form-error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="quests-page">
      <section className="hero hero--compact">
        <h1>Quests</h1>
        {dailyProgress.total > 0 ? (
          <p className="quests-today-summary" role="status">
            Hoje: <strong>{dailyProgress.done}</strong> de <strong>{dailyProgress.total}</strong>{' '}
            diárias feitas
            {dailyProgress.pending > 0 ? ` · ${dailyProgress.pending} pendente${dailyProgress.pending === 1 ? '' : 's'}` : ''}
            {refreshing ? <span className="quests-refresh-hint muted"> · atualizando…</span> : null}
          </p>
        ) : (
          <p className="muted">
            Marque <strong>Concluir</strong> ou <strong>Não fiz hoje</strong> nas suas quests diárias.
          </p>
        )}
      </section>

      {error && (
        <p className="form-error quests-inline-error" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">Nenhuma quest ainda. Aceite uma sugestão abaixo ou crie a sua.</p>
        </div>
      ) : (
        <>
          {pendingItems.length > 0 && (
            <section className="section quests-section" aria-labelledby="quests-pending-heading">
              <h2 id="quests-pending-heading" className="quests-section-title">
                Para hoje ({pendingItems.length})
              </h2>
              <ul className="quest-list" role="list">
                {pendingItems.map((item) => (
                  <li key={item.quest.id}>{renderQuestCard(item)}</li>
                ))}
              </ul>
            </section>
          )}

          {otherItems.length > 0 && (
            <section className="section quests-section" aria-labelledby="quests-other-heading">
              <h2 id="quests-other-heading" className="quests-section-title">
                {pendingItems.length === 0 ? 'Suas quests' : 'Semanais e outras'} ({otherItems.length})
              </h2>
              <ul className="quest-list" role="list">
                {otherItems.map((item) => (
                  <li key={item.quest.id}>{renderQuestCard(item)}</li>
                ))}
              </ul>
            </section>
          )}

          {doneTodayItems.length > 0 && (
            <details className="quests-done-details" open={pendingItems.length === 0}>
              <summary>
                Feitas hoje ({doneTodayItems.length})
              </summary>
              <ul className="quest-list" role="list">
                {doneTodayItems.map((item) => (
                  <li key={item.quest.id}>{renderQuestCard(item)}</li>
                ))}
              </ul>
            </details>
          )}

          {pendingItems.length === 0 && otherItems.length === 0 && doneTodayItems.length > 0 && (
            <p className="card quests-all-done muted" role="status">
              Todas as quests de hoje foram registradas.
            </p>
          )}
        </>
      )}

      <details className="quests-secondary-details" open={items.length === 0}>
        <summary>Explorar presets e criar quest</summary>
        <div className="quests-secondary-body">
          <QuestPresetSuggestions items={items} onAdd={addQuest} />
          <QuestForm patterns={patterns} onSubmit={addQuest} />
        </div>
      </details>

      <EvolutionNotice evolution={evolutionNotice} onDismiss={dismissEvolution} />
      <PeriodReviewDialog
        review={periodReview}
        busy={reviewBusy}
        onDismiss={dismissPeriodReview}
        onEvolve={acceptEvolution}
        onRestart={restartPeriod}
        onArchive={archiveFromReview}
      />
      <QuestMissDialog
        open={Boolean(missDialog)}
        quest={missDialog?.quest}
        version={missDialog?.version}
        onClose={closeMissDialog}
        onSubmit={recordMiss}
      />
    </div>
  );
}
