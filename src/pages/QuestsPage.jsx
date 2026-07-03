import { useEffect, useState } from 'react';
import QuestPresetSuggestions from '../components/QuestPresetSuggestions.jsx';
import EvolutionNotice from '../components/EvolutionNotice.jsx';
import IncompleteDailiesBanner from '../components/IncompleteDailiesBanner.jsx';
import PeriodReviewDialog from '../components/PeriodReviewDialog.jsx';
import QuestCard from '../components/QuestCard.jsx';
import QuestForm from '../components/QuestForm.jsx';
import QuestMissDialog from '../components/QuestMissDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFlashcards } from '../hooks/useFlashcards.js';
import { useQuests } from '../hooks/useQuests.js';
import { fetchPatterns, seedDefaultPatterns } from '../lib/api/patterns.js';
import { buildFlashcardFromQuest, hasCardForQuestItem } from '../lib/questFlashcards.js';

export default function QuestsPage() {
  const { user } = useAuth();
  const {
    items,
    loading,
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

  if (loading) {
    return (
      <div className="screen-center" role="status" aria-live="polite">
        <p className="muted">Carregando quests…</p>
      </div>
    );
  }

  if (error) {
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
      <section className="hero">
        <h1>Quests</h1>
        <p className="muted">
          Hábitos do dia — marque <strong>Concluir</strong> ou <strong>Não fiz hoje</strong>. Cards de
          revisão são opcionais (aba Cards).
        </p>
      </section>

      <QuestPresetSuggestions items={items} onAdd={addQuest} />

      <IncompleteDailiesBanner items={items} onRegisterMiss={openMissDialog} />

      <QuestForm patterns={patterns} onSubmit={addQuest} />

      <section className="section" aria-labelledby="quests-list-heading">
        <div className="section-header">
          <h2 id="quests-list-heading">Ativas ({items.length})</h2>
        </div>

        {items.length === 0 ? (
          <div className="card empty-state">
            <p className="muted">Nenhuma quest ainda. Crie a primeira acima.</p>
          </div>
        ) : (
          <ul className="quest-list" role="list">
            {items.map((item) => (
              <li key={item.quest.id}>
                <QuestCard
                  item={item}
                  onComplete={complete}
                  onRecalibrate={recalibrate}
                  onRemove={handleRemove}
                  onSimulatePeriodReview={simulatePeriodReview}
                  onOpenMiss={openMissDialog}
                  onRecordMiss={recordMiss}
                  hasLinkedCard={hasCardForQuestItem(cards, item.quest, item.version)}
                  onCreateFlashcard={handleCreateFlashcard}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

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
