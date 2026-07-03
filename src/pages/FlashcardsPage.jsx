import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FlashcardDeckFilter from '../components/FlashcardDeckFilter.jsx';
import FlashcardForm from '../components/FlashcardForm.jsx';
import FlashcardHowItWorks from '../components/FlashcardHowItWorks.jsx';
import FlashcardReviewSession from '../components/FlashcardReviewSession.jsx';
import QuestFlashcardSuggestions from '../components/QuestFlashcardSuggestions.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFlashcards } from '../hooks/useFlashcards.js';
import { useQuests } from '../hooks/useQuests.js';
import { fetchPatterns, seedDefaultPatterns } from '../lib/api/patterns.js';
import { isQuestGeneratedCard } from '../lib/api/flashcards.js';
import {
  getNotificationPermission,
  notificationsSupported,
  notifyDueFlashcards,
  requestFlashcardNotifications
} from '../lib/flashcardNotifications.js';
import { filterCardsByDeck, getDeckLabel } from '../lib/flashcardDecks.js';
import { STARTER_FLASHCARDS } from '../lib/flashcards.js';

function formatNextReview(iso) {
  const date = new Date(iso);
  const now = new Date();
  if (date.getTime() <= now.getTime()) return 'Agora';
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (diffDays === 1) return 'Amanhã';
  return `Em ${diffDays} dias`;
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const { items: questItems } = useQuests();
  const {
    cards,
    dueCount,
    loading,
    error,
    reviewing,
    addCard,
    addCards,
    addStarterCards,
    review,
    removeCard,
    removeQuestCards
  } = useFlashcards();
  const [patterns, setPatterns] = useState([]);
  const [deckFilter, setDeckFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notifyPermission, setNotifyPermission] = useState(() => getNotificationPermission());
  const [addingStarters, setAddingStarters] = useState(false);
  const [purgingQuestCards, setPurgingQuestCards] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const questCardCount = useMemo(() => cards.filter(isQuestGeneratedCard).length, [cards]);

  const filteredCards = useMemo(
    () => filterCardsByDeck(cards, deckFilter),
    [cards, deckFilter]
  );
  const filteredDueCards = useMemo(() => {
    const now = Date.now();
    return filteredCards.filter((c) => new Date(c.next_review_at).getTime() <= now);
  }, [filteredCards]);
  const filteredDueCount = filteredDueCards.length;
  const currentCard = filteredDueCards[0] ?? null;
  const nextScheduled = useMemo(() => {
    if (!cards.length || dueCount > 0) return null;
    const future = cards
      .map((c) => new Date(c.next_review_at).getTime())
      .filter((t) => t > Date.now())
      .sort((a, b) => a - b);
    return future.length ? new Date(future[0]) : null;
  }, [cards, dueCount]);

  useEffect(() => {
    if (!user) return;
    seedDefaultPatterns(user.id)
      .then(() => fetchPatterns(user.id))
      .then(setPatterns)
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (dueCount > 0) notifyDueFlashcards(dueCount);
  }, [dueCount]);

  async function handleEnableNotifications() {
    const result = await requestFlashcardNotifications();
    setNotifyPermission(result);
    if (result === 'granted' && dueCount > 0) notifyDueFlashcards(dueCount);
  }

  async function handleAddStarters() {
    setAddingStarters(true);
    try {
      await addStarterCards(STARTER_FLASHCARDS, patterns);
    } finally {
      setAddingStarters(false);
    }
  }

  async function handlePurgeQuestCards() {
    if (questCardCount === 0) {
      setPurgeMessage('Nenhum card de quest para remover.');
      return;
    }

    const ok = window.confirm(
      `Remover todos os ${questCardCount} card(s) de quests?\n\nMantém os cards dos padrões A/B/C e estudo livre.`
    );
    if (!ok) return;

    setPurgingQuestCards(true);
    setPurgeMessage('');
    try {
      const removed = await removeQuestCards();
      setPurgeMessage(`${removed} card(s) de quests removido(s). Você pode criar de novo nas quests.`);
    } catch (err) {
      setPurgeMessage(err.message ?? 'Erro ao remover cards de quests.');
    } finally {
      setPurgingQuestCards(false);
    }
  }

  useEffect(() => {
    if (!user || loading || searchParams.get('purgeQuestCards') !== '1') return;
    setSearchParams({}, { replace: true });
    handlePurgeQuestCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- disparo único via URL
  }, [user, loading, searchParams]);

  if (loading) {
    return (
      <div className="screen-center" role="status" aria-live="polite">
        <p className="muted">Carregando cards…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-center">
        <p className="form-error" role="alert">
          {error}
        </p>
        <p className="muted" style={{ marginTop: '1rem', maxWidth: '28rem' }}>
          Se o erro mencionar coluna <code>deck</code> ou <code>quest_id</code>, rode{' '}
          <code>schema-flashcards-ext.sql</code> no SQL Editor do Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="flashcards-page">
      <section className="hero">
        <h1>Cards</h1>
        <p className="muted">Revisão espaçada (Anki) — opcional e separada das quests do dia.</p>
      </section>

      <FlashcardHowItWorks />

      <section
        className={`section flashcard-review-section${filteredDueCount > 0 ? ' flashcard-review-section--active' : ''}`}
        aria-labelledby="review-heading"
      >
        <div className="section-header">
          <h2 id="review-heading">Revisão agora</h2>
          {filteredDueCount > 0 ? (
            <p className="muted">{filteredDueCount} card(s) devido(s) neste filtro</p>
          ) : dueCount > 0 && deckFilter !== 'all' ? (
            <p className="muted">
              Nenhum devido em {getDeckLabel(deckFilter)}.{' '}
              <button type="button" className="btn-link" onClick={() => setDeckFilter('all')}>
                Ver todos ({dueCount} devido{dueCount === 1 ? '' : 's'})
              </button>
            </p>
          ) : nextScheduled ? (
            <p className="muted">Próxima revisão: {formatNextReview(nextScheduled.toISOString())}</p>
          ) : (
            <p className="muted">Adicione cards abaixo — novos ficam devidos na hora.</p>
          )}
        </div>
        <FlashcardReviewSession card={currentCard} busy={reviewing} onReview={review} />
      </section>

      <section className="card flashcard-stats" aria-label="Estatísticas de revisão">
        <div className="flashcard-stat">
          <span className="flashcard-stat-value">{dueCount}</span>
          <span className="flashcard-stat-label muted">devidos no total</span>
        </div>
        <div className="flashcard-stat">
          <span className="flashcard-stat-value">{cards.length}</span>
          <span className="flashcard-stat-label muted">cards no baralho</span>
        </div>
      </section>

      {cards.length > 0 && (
        <FlashcardDeckFilter value={deckFilter} cards={cards} onChange={setDeckFilter} />
      )}

      <QuestFlashcardSuggestions
        questItems={questItems}
        cards={cards}
        onAdd={addCard}
        onAddAll={addCards}
      />

      {questCardCount > 0 && (
        <section className="card flashcard-purge-banner" aria-label="Limpar cards de quests">
          <p className="muted">
            {questCardCount} card(s) de quests no baralho
            {questCardCount > 1 ? ' (inclui duplicatas antigas)' : ''}.
          </p>
          <button
            type="button"
            className="btn-ghost btn-ghost-sm"
            onClick={handlePurgeQuestCards}
            disabled={purgingQuestCards}
          >
            {purgingQuestCards ? 'Removendo…' : 'Remover todos os cards de quests'}
          </button>
          {purgeMessage && (
            <p className="muted" role="status" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              {purgeMessage}
            </p>
          )}
        </section>
      )}

      {notificationsSupported() && notifyPermission !== 'granted' && (
        <section className="card flashcard-notify-banner">
          <p className="muted">Ative lembretes quando houver cards para revisar.</p>
          <button
            type="button"
            className="btn-ghost btn-ghost-sm"
            onClick={handleEnableNotifications}
            disabled={notifyPermission === 'denied'}
          >
            {notifyPermission === 'denied' ? 'Bloqueado no navegador' : 'Ativar lembretes'}
          </button>
        </section>
      )}

      {cards.length === 0 ? (
        <section className="card empty-state">
          <p className="muted">
            Sem cards ainda. Comece pelos padrões A/B/C ou crie cards a partir das quests (opcional).
          </p>
          <button
            type="button"
            className="btn-primary btn-inline"
            disabled={addingStarters}
            onClick={handleAddStarters}
          >
            {addingStarters ? 'Adicionando…' : 'Adicionar cards dos padrões A/B/C'}
          </button>
        </section>
      ) : null}

      <section className="section">
        <button
          type="button"
          className="btn-ghost section-header-action"
          onClick={() => setShowCreateForm((v) => !v)}
          aria-expanded={showCreateForm}
        >
          {showCreateForm ? 'Ocultar formulário' : 'Criar card manual'}
        </button>
        {showCreateForm && <FlashcardForm patterns={patterns} onSubmit={addCard} />}
      </section>

      {cards.length > 0 && (
        <details className="flashcard-deck-details">
          <summary>Seu baralho ({filteredCards.length}) — consulta e exclusão</summary>
          <p className="muted flashcard-deck-details-hint">
            Para estudar, use a seção <strong>Revisão agora</strong> no topo — não é preciso abrir cada
            card aqui.
          </p>
          <ul className="flashcard-deck-list" role="list">
            {filteredCards.map((card) => {
              const isDue = new Date(card.next_review_at).getTime() <= Date.now();
              const pattern = patterns.find((p) => p.id === card.pattern_id);
              return (
                <li key={card.id}>
                  <article className={`flashcard-deck-item card ${isDue ? 'flashcard-deck-item--due' : ''}`}>
                    <div>
                      <p className="flashcard-deck-front">{card.front}</p>
                      <p className="flashcard-deck-back muted">{card.back}</p>
                      <p className="flashcard-deck-meta muted">
                        {getDeckLabel(card.deck)}
                        {pattern ? ` · ${pattern.code}` : ''}
                        {' · '}
                        {formatNextReview(card.next_review_at)}
                        {isDue ? ' · devido' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-link btn-link-danger"
                      onClick={() => {
                        if (window.confirm('Excluir este card?')) removeCard(card.id);
                      }}
                    >
                      Excluir
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}
