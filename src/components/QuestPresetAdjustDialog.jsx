import { useEffect, useId, useState } from 'react';
import { getHabitFramework } from '../lib/habitFrameworks.js';
import { QUEST_TIME_SLOTS } from '../lib/questTimeSlots.js';
import ModalDialog from './ModalDialog.jsx';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {import('../lib/questPresets.js').QuestPreset | null} props.preset
 * @param {() => void} props.onClose
 * @param {(input: object) => Promise<void>} props.onSubmit
 */
export default function QuestPresetAdjustDialog({ open, preset, onClose, onSubmit }) {
  const titleId = useId();
  const targetId = useId();
  const validationId = useId();
  const streakId = useId();
  const errorId = useId();

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [validation, setValidation] = useState('');
  const [timeSlot, setTimeSlot] = useState('anytime');
  const [wakeDependent, setWakeDependent] = useState(false);
  const [streakRequired, setStreakRequired] = useState(21);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const framework = preset ? getHabitFramework(preset.framework) : null;

  useEffect(() => {
    if (!open || !preset) return;
    setTitle(preset.title);
    setTarget(preset.target);
    setValidation(preset.validation);
    setTimeSlot(preset.timeSlot);
    setWakeDependent(preset.wakeDependent);
    setStreakRequired(preset.streakRequired);
    setError('');
  }, [open, preset]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!preset) return;
    setError('');

    if (!title.trim() || !target.trim()) {
      setError('Título e meta são obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category: preset.category,
        questType: 'daily',
        patternId: null,
        target: target.trim(),
        validation: validation.trim() || null,
        streakRequired: Number(streakRequired) || preset.streakRequired,
        framework: preset.framework,
        frameworkFields: {},
        timeSlot,
        wakeDependent: timeSlot === 'morning' ? wakeDependent : false,
        presetId: preset.id,
        tradition: preset.tradition,
        source: preset.source
      });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Não foi possível criar a quest.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!preset) return null;

  return (
    <ModalDialog open={open} title="Ajustar preset" onClose={onClose}>
      <form className="quest-form" onSubmit={handleSubmit}>
        <p className="muted preset-adjust-intro">
          {preset.source} · {framework?.label}
        </p>

        <div>
          <label htmlFor={titleId}>Título</label>
          <input id={titleId} type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label htmlFor="preset-time-slot">Período do dia</label>
          <select
            id="preset-time-slot"
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
          <label className="checkbox-field" htmlFor="preset-wake-dependent">
            <input
              id="preset-wake-dependent"
              type="checkbox"
              checked={wakeDependent}
              onChange={(e) => setWakeDependent(e.target.checked)}
            />
            Depende de acordar cedo
          </label>
        )}

        <div>
          <label htmlFor={targetId}>Meta</label>
          <textarea id={targetId} rows={3} required value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>

        <div>
          <label htmlFor={validationId}>Validação</label>
          <input id={validationId} type="text" value={validation} onChange={(e) => setValidation(e.target.value)} />
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
        </div>

        {error && (
          <p id={errorId} className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Criando…' : 'Criar quest'}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
