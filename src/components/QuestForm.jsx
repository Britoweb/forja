import { useId, useState } from 'react';
import {
  buildSuggestedTarget,
  getHabitFramework,
  HABIT_FRAMEWORKS
} from '../lib/habitFrameworks.js';
import { QUEST_CATEGORIES, QUEST_TYPES } from '../lib/quests.js';
import { QUEST_TIME_SLOTS } from '../lib/questTimeSlots.js';

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
  const frameworkGroupId = useId();

  const [step, setStep] = useState('choose');
  const [selectedFrameworkId, setSelectedFrameworkId] = useState(null);
  const [frameworkFields, setFrameworkFields] = useState({});

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('physical');
  const [questType, setQuestType] = useState('daily');
  const [patternId, setPatternId] = useState('');
  const [target, setTarget] = useState('');
  const [validation, setValidation] = useState('');
  const [streakRequired, setStreakRequired] = useState(DEFAULT_STREAK);
  const [timeSlot, setTimeSlot] = useState('anytime');
  const [wakeDependent, setWakeDependent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const framework = selectedFrameworkId ? getHabitFramework(selectedFrameworkId) : null;

  function resetForm() {
    setStep('choose');
    setSelectedFrameworkId(null);
    setFrameworkFields({});
    setTitle('');
    setTarget('');
    setValidation('');
    setPatternId('');
    setStreakRequired(DEFAULT_STREAK);
    setTimeSlot('anytime');
    setWakeDependent(false);
    setError('');
  }

  function handleToggleExpanded() {
    setExpanded((open) => {
      if (open) resetForm();
      return !open;
    });
  }

  /**
   * @param {import('../lib/habitFrameworks.js').HabitFrameworkId} id
   */
  function handleSelectFramework(id) {
    const selected = getHabitFramework(id);
    setSelectedFrameworkId(id);
    setFrameworkFields({});
    setStreakRequired(selected.streakRequired);
    setTarget('');
    setValidation('');
    setStep('details');
    setError('');
  }

  function handleBackToChoose() {
    setStep('choose');
    setError('');
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  function handleFrameworkFieldChange(key, value) {
    const next = { ...frameworkFields, [key]: value };
    setFrameworkFields(next);

    if (framework?.id === 'if_then') {
      const suggested = buildSuggestedTarget(framework, next);
      if (suggested) setTarget(suggested);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!title.trim() || !target.trim()) {
      setError('Título e meta são obrigatórios.');
      return;
    }

    const filledFrameworkFields = Object.fromEntries(
      Object.entries(frameworkFields).filter(([, value]) => value?.trim())
    );

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        questType,
        patternId: patternId || null,
        target: target.trim(),
        validation: validation.trim() || null,
        streakRequired: Number(streakRequired) || DEFAULT_STREAK,
        framework: selectedFrameworkId ?? 'custom',
        frameworkFields: filledFrameworkFields,
        timeSlot: questType === 'daily' ? timeSlot : 'anytime',
        wakeDependent: questType === 'daily' && timeSlot === 'morning' ? wakeDependent : false
      });
      resetForm();
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
        onClick={handleToggleExpanded}
      >
        <h2 id="new-quest-heading">Nova quest</h2>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && step === 'choose' && (
        <div className="quest-form quest-framework-step">
          <p className="quest-framework-intro">
            Antes de definir a meta, escolha <strong>como</strong> você quer construir este hábito.
          </p>

          <div
            className="framework-grid"
            role="radiogroup"
            aria-labelledby={`${frameworkGroupId}-label`}
          >
            <p id={`${frameworkGroupId}-label`} className="sr-only">
              Abordagem para formar o hábito
            </p>

            {HABIT_FRAMEWORKS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selectedFrameworkId === option.id}
                className="framework-card"
                onClick={() => handleSelectFramework(option.id)}
              >
                <span className="framework-card-label">{option.label}</span>
                <span className="framework-card-source muted">{option.source}</span>
                <span className="framework-card-desc">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {expanded && step === 'details' && framework && (
        <form className="quest-form" onSubmit={handleSubmit}>
          <div className="framework-selected card-inset">
            <div className="framework-selected-header">
              <div>
                <p className="framework-selected-kicker muted">Abordagem</p>
                <p className="framework-selected-title">{framework.label}</p>
                <p className="framework-selected-source muted">{framework.source}</p>
              </div>
              <button type="button" className="btn-ghost btn-ghost-sm" onClick={handleBackToChoose}>
                Trocar
              </button>
            </div>
            <ul className="framework-principles muted">
              {framework.principles.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>
          </div>

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

          {questType === 'daily' && (
            <div className="form-row">
              <div>
                <label htmlFor="quest-time-slot">Período do dia</label>
                <select
                  id="quest-time-slot"
                  value={timeSlot}
                  onChange={(e) => {
                    const next = e.target.value;
                    setTimeSlot(next);
                    if (next !== 'morning') setWakeDependent(false);
                  }}
                >
                  {Object.entries(QUEST_TIME_SLOTS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {timeSlot === 'morning' && (
                <div className="checkbox-field">
                  <label htmlFor="quest-wake-dependent">
                    <input
                      id="quest-wake-dependent"
                      type="checkbox"
                      checked={wakeDependent}
                      onChange={(e) => setWakeDependent(e.target.checked)}
                    />
                    Depende de acordar cedo
                  </label>
                  <p className="field-hint muted">
                    Se não fizer, o sistema pergunta se foi por não acordar no horário.
                  </p>
                </div>
              )}
            </div>
          )}

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

          {framework.extraFields?.map((field) => (
            <div key={field.key}>
              <label htmlFor={`framework-${field.key}`}>{field.label}</label>
              <input
                id={`framework-${field.key}`}
                type="text"
                value={frameworkFields[field.key] ?? ''}
                onChange={(e) => handleFrameworkFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <div>
            <label htmlFor={targetId}>Meta</label>
            <input
              id={targetId}
              type="text"
              required
              aria-required="true"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={framework.targetPlaceholder}
            />
          </div>

          <div>
            <label htmlFor={validationId}>Validação (opcional)</label>
            <input
              id={validationId}
              type="text"
              value={validation}
              onChange={(e) => setValidation(e.target.value)}
              placeholder={framework.validationPlaceholder}
            />
          </div>

          <div>
            <label htmlFor={streakId}>Duração do ciclo (dias)</label>
            <input
              id={streakId}
              type="number"
              min={7}
              max={120}
              value={streakRequired}
              onChange={(e) => setStreakRequired(e.target.value)}
            />
            <p className="field-hint muted">
              Ao fim deste período, o sistema avalia sua consistência e sugere evoluir ou recomeçar.
              Sugerido para {framework.label}: {framework.streakRequired} dias
              {framework.id === 'science_66' ? ' (~22 dias por tier)' : ''}.
            </p>
          </div>

          {error && (
            <p id={errorId} className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={handleBackToChoose}>
              Voltar
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} aria-disabled={submitting}>
              {submitting ? 'Criando…' : 'Criar quest'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
