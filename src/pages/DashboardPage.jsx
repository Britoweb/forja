import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EvolutionNotice from '../components/EvolutionNotice.jsx';
import PatternCard from '../components/PatternCard.jsx';
import QuestCard from '../components/QuestCard.jsx';
import XpBar from '../components/XpBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useQuests } from '../hooks/useQuests.js';
import { fetchPatterns, seedDefaultPatterns } from '../lib/api/patterns.js';
import { fetchTotalXp } from '../lib/api/xp.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const { items: quests, complete, recalibrate, removeQuest, evolutionNotice, dismissEvolution } =
    useQuests();
  const [patterns, setPatterns] = useState([]);
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
        const [patternRows, xpTotal] = await Promise.all([
          fetchPatterns(user.id),
          fetchTotalXp(user.id)
        ]);

        if (!cancelled) {
          setPatterns(patternRows);
          setTotalXp(xpTotal);
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

      <section className="section" aria-labelledby="quests-preview-heading">
        <div className="section-header section-header-row">
          <div>
            <h2 id="quests-preview-heading">Quests de hoje</h2>
            <p className="muted">{quests.length} quest(s) ativa(s)</p>
          </div>
          <Link to="/quests" className="btn-ghost">
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
    </div>
  );
}
