import { useId, useState } from 'react';
import { QUEST_CATEGORIES, QUEST_TYPES } from '../lib/quests.js';

const DEFAULT_STREAK = 28;

/**
 * @param {object} props
 * @param {object[]} props.patterns
 * @param {(input: object) => Promise<void>} props.onSubmit
 */
export default function QuestForm({ patterns, onSubmit }) {
  const titleId = useId();
  const targetId = useId();
  const validationId = useId();
  const streakId = useId();
  const errorId = useId();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('physical');
  const [questType, setQuestType] = useState('daily');
  const [patternId, setPatternId] = useState('');
  const [target, setTarget] = useState('');
  const [validation, setValidation] = useState('');
  const [streakRequired, setStreakRequired] = useState(DEFAULT_STREAK);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!title.trim() || !target.trim()) {
      setError('Título e meta são obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        questType,
        patternId: patternId || null,
        target: target.trim(),
        validation: validation.trim() || null,
        streakRequired: Number(streakRequired) || DEFAULT_STREAK
      });
      setTitle('');
      setTarget('');
      setValidation('');
      setPatternId('');
      setStreakRequired(DEFAULT_STREAK);
      setExpanded(false);
    } catch (err) {
      setError(err.message ?? 'Não foi possível criar a quest.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card quest-form-section" aria-labelledby="new-quest-heading">
      <button
        type="button"
        className="quest-form-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <h2 id="new-quest-heading">Nova quest</h2>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <form className="quest-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={titleId}>Título</label>
            <input
              id={titleId}
              type="text"
              required
              aria-required="true"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Academia 3x por semana"
            />
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="quest-category">Categoria</label>
              <select
                id="quest-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(QUEST_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quest-type">Frequência</label>
              <select id="quest-type" value={questType} onChange={(e) => setQuestType(e.target.value)}>
                {Object.entries(QUEST_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="quest-pattern">Padrão (opcional)</label>
            <select id="quest-pattern" value={patternId} onChange={(e) => setPatternId(e.target.value)}>
              <option value="">Nenhum</option>
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={targetId}>Meta</label>
            <input
              id={targetId}
              type="text"
              required
              aria-required="true"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Ex.: Treinar 3x por semana"
            />
          </div>

          <div>
            <label htmlFor={validationId}>Validação (opcional)</label>
            <input
              id={validationId}
              type="text"
              value={validation}
              onChange={(e) => setValidation(e.target.value)}
              placeholder="Como saber que cumpriu?"
            />
          </div>

          <div>
            <label htmlFor={streakId}>Dias para evoluir de tier</label>
            <input
              id={streakId}
              type="number"
              min={7}
              max={90}
              value={streakRequired}
              onChange={(e) => setStreakRequired(e.target.value)}
            />
          </div>

          {error && (
            <p id={errorId} className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={submitting} aria-disabled={submitting}>
            {submitting ? 'Criando…' : 'Criar quest'}
          </button>
        </form>
      )}
    </section>
  );
}
