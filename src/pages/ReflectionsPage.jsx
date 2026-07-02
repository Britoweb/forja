import { useEffect, useState } from 'react';
import ReflectionForm from '../components/ReflectionForm.jsx';
import { ReflectionHistoryItem } from '../components/FlagCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useReflections } from '../hooks/useReflections.js';
import { fetchPatterns, seedDefaultPatterns } from '../lib/api/patterns.js';
import { REFLECTION_TYPE_LABELS } from '../lib/reflectionPrompts.js';

export default function ReflectionsPage() {
  const { user } = useAuth();
  const { items, today, loading, error, saving, save } = useReflections();
  const [patterns, setPatterns] = useState([]);
  const [activeType, setActiveType] = useState('morning');

  useEffect(() => {
    if (!user) return;
    seedDefaultPatterns(user.id)
      .then(() => fetchPatterns(user.id))
      .then(setPatterns)
      .catch(() => {});
  }, [user]);

  const morningDone = Boolean(today.morning);
  const eveningDone = Boolean(today.evening);
  const currentDone = activeType === 'morning' ? morningDone : eveningDone;

  if (loading) {
    return (
      <div className="screen-center" role="status" aria-live="polite">
        <p className="muted">Carregando reflexões…</p>
      </div>
    );
  }

  return (
    <div className="reflections-page">
      <section className="hero">
        <h1>Reflexões</h1>
        <p className="muted">
          Diário estóico — manhã e noite. Marque os padrões A, B ou C quando fizer sentido.
        </p>
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="section section--reflection-today" aria-labelledby="today-reflection-heading">
        <div className="section-header">
          <h2 id="today-reflection-heading">Hoje</h2>
          <p className="muted">
            Manhã: {morningDone ? 'feita' : 'pendente'} · Noite: {eveningDone ? 'feita' : 'pendente'}
          </p>
        </div>

        <div className="reflection-type-tabs" role="tablist" aria-label="Tipo de reflexão">
          {(['morning', 'evening']).map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={activeType === type}
              className={activeType === type ? 'tab active' : 'tab'}
              onClick={() => setActiveType(type)}
            >
              {REFLECTION_TYPE_LABELS[type]}
              {(type === 'morning' ? morningDone : eveningDone) && (
                <span className="tab-done" aria-label="Concluída">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>

        {currentDone ? (
          <div className="card empty-state reflection-today-empty">
            <p>
              Reflexão da {REFLECTION_TYPE_LABELS[activeType].toLowerCase()} já registrada hoje.
            </p>
          </div>
        ) : (
          <ReflectionForm
            patterns={patterns}
            type={activeType}
            onSubmit={save}
            busy={saving}
          />
        )}
      </section>

      <section className="section" aria-labelledby="reflection-history-heading">
        <div className="section-header">
          <h2 id="reflection-history-heading">Histórico recente</h2>
          <p className="muted">Últimos 30 dias</p>
        </div>

        {items.length === 0 ? (
          <div className="card empty-state">
            <p className="muted">Nenhuma reflexão ainda. Comece pela manhã ou pelo exame da noite.</p>
          </div>
        ) : (
          <ul className="reflection-history-list" role="list">
            {items.map((reflection) => (
              <li key={reflection.id}>
                <ReflectionHistoryItem reflection={reflection} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
