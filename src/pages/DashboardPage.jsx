import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EvolutionNotice from '../components/EvolutionNotice.jsx';
import IncompleteDailiesBanner from '../components/IncompleteDailiesBanner.jsx';
import PeriodReviewDialog from '../components/PeriodReviewDialog.jsx';
import PatternCard from '../components/PatternCard.jsx';
import QuestCard from '../components/QuestCard.jsx';
import QuestMissDialog from '../components/QuestMissDialog.jsx';
import XpBar from '../components/XpBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useQuests } from '../hooks/useQuests.js';
import { fetchPatterns, seedDefaultPatterns } from '../lib/api/patterns.js';
import { fetchDueFlashcardCount } from '../lib/api/flashcards.js';
import { fetchUnresolvedFlagCount } from '../lib/api/flags.js';
import { fetchTodayReflections } from '../lib/api/reflections.js';
import { fetchTotalXp } from '../lib/api/xp.js';
import { REFLECTION_TYPE_LABELS } from '../lib/reflectionPrompts.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    items: quests,
    complete,
    recalibrate,
    removeQuest,
    evolutionNotice,
    periodReview,
    reviewBusy,
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
  const [patterns, setPatterns] = useState([]);
  const [dueFlashcards, setDueFlashcards] = useState(0);
  const [openFlags, setOpenFlags] = useState(0);
  const [reflectionToday, setReflectionToday] = useState({ morning: false, evening: false });
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        await seedDefaultPatterns(user.id);
        const [patternRows, xpTotal, dueCards, flagCount, todayReflections] = await Promise.all([
          fetchPatterns(user.id),
          fetchTotalXp(user.id),
          fetchDueFlashcardCount(user.id),
          fetchUnresolvedFlagCount(user.id),
          fetchTodayReflections(user.id)
        ]);

        if (!cancelled) {
          setPatterns(patternRows);
          setTotalXp(xpTotal);
          setDueFlashcards(dueCards);
          setOpenFlags(flagCount);
          setReflectionToday({
            morning: todayReflections.some((r) => r.type === 'morning'),
            evening: todayReflections.some((r) => r.type === 'evening')
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? 'Erro ao carregar o dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!loading && user) {
      fetchTotalXp(user.id).then(setTotalXp).catch(() => {});
    }
  }, [quests, loading, user]);

  const previewQuests = quests.slice(0, 3);

  async function handleRemove(questId) {
    if (!window.confirm('Arquivar esta quest?')) return;
    await removeQuest(questId);
    if (user) fetchTotalXp(user.id).then(setTotalXp).catch(() => {});
  }

  if (loading) {
    return (
      <div className="screen-center" role="status" aria-live="polite">
        <p className="muted">Preparando sua forja…</p>
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
    <div className="dashboard">
      <section className="hero">
        <h1>Dashboard</h1>
        <p className="muted">Visão geral dos seus hábitos e padrões.</p>
      </section>

      <XpBar totalXp={totalXp} />

      <IncompleteDailiesBanner items={quests} onRegisterMiss={openMissDialog} />

      <section className="section" aria-labelledby="reflections-preview-heading">
        <div className="section-header section-header-stack">
          <div>
            <h2 id="reflections-preview-heading">Diário de hoje</h2>
            <p className="muted">
              {REFLECTION_TYPE_LABELS.morning}: {reflectionToday.morning ? 'feita' : 'pendente'} ·{' '}
              {REFLECTION_TYPE_LABELS.evening}: {reflectionToday.evening ? 'feita' : 'pendente'}
            </p>
          </div>
          <Link to="/reflections" className="btn-ghost section-header-action">
            Abrir diário
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="report-preview-heading">
        <div className="section-header section-header-stack">
          <div>
            <h2 id="report-preview-heading">Relatório</h2>
            <p className="muted">
              {openFlags > 0
                ? `${openFlags} sinal(is) de inconsistência em aberto`
                : 'Nenhum flag em aberto — rode a análise após alguns dias de uso'}
            </p>
          </div>
          <Link to="/report" className="btn-ghost section-header-action">
            Ver relatório
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="flashcards-preview-heading">
        <div className="section-header section-header-stack">
          <div>
            <h2 id="flashcards-preview-heading">Cards para revisar</h2>
            <p className="muted">
              {dueFlashcards > 0
                ? `${dueFlashcards} card(s) devido(s) — algoritmo SM-2`
                : 'Nenhum card devido agora'}
            </p>
          </div>
          <Link to="/flashcards" className="btn-ghost section-header-action">
            {dueFlashcards > 0 ? 'Revisar' : 'Ver cards'}
          </Link>
        </div>
        {dueFlashcards > 0 && (
          <div className="card flashcard-dashboard-cta">
            <p>Revisão espaçada fortalece os reframes dos padrões A, B e C.</p>
            <Link to="/flashcards" className="btn-primary btn-inline">
              Iniciar revisão ({dueFlashcards})
            </Link>
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="quests-preview-heading">
        <div className="section-header section-header-stack">
          <div>
            <h2 id="quests-preview-heading">Quests de hoje</h2>
            <p className="muted">{quests.length} quest(s) ativa(s)</p>
          </div>
          <Link to="/quests" className="btn-ghost section-header-action">
            Ver todas
          </Link>
        </div>

        {previewQuests.length === 0 ? (
          <div className="card empty-state">
            <p className="muted">Nenhuma quest ativa.</p>
            <Link to="/quests" className="btn-primary btn-inline">
              Criar primeira quest
            </Link>
          </div>
        ) : (
          <ul className="quest-list" role="list">
            {previewQuests.map((item) => (
              <li key={item.quest.id}>
                <QuestCard
                  item={item}
                  onComplete={async (payload) => {
                    const result = await complete(payload);
                    if (user) fetchTotalXp(user.id).then(setTotalXp).catch(() => {});
                    return result;
                  }}
                  onRecalibrate={recalibrate}
                  onRemove={handleRemove}
                  onSimulatePeriodReview={simulatePeriodReview}
                  onOpenMiss={openMissDialog}
                  onRecordMiss={recordMiss}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="patterns-heading">
        <div className="section-header">
          <h2 id="patterns-heading">Padrões</h2>
          <p className="muted">Os três eixos de auto-observação.</p>
        </div>
        <div className="pattern-grid">
          {patterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
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
