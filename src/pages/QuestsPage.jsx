import { useEffect, useState } from 'react';
import EvolutionNotice from '../components/EvolutionNotice.jsx';
import QuestCard from '../components/QuestCard.jsx';
import QuestForm from '../components/QuestForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useQuests } from '../hooks/useQuests.js';
import { fetchPatterns, seedDefaultPatterns } from '../lib/api/patterns.js';

export default function QuestsPage() {
  const { user } = useAuth();
  const {
    items,
    loading,
    error,
    evolutionNotice,
    addQuest,
    complete,
    recalibrate,
    removeQuest,
    dismissEvolution
  } = useQuests();
  const [patterns, setPatterns] = useState([]);

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
        <p className="muted">Hábitos adaptativos com streaks e evolução de tier.</p>
      </section>

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
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <EvolutionNotice evolution={evolutionNotice} onDismiss={dismissEvolution} />
    </div>
  );
}
