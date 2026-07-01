import { useId, useState } from 'react';
import { REFLECTION_PROMPTS } from '../lib/reflectionPrompts.js';
import { reflectionPlainText } from '../lib/detection/textUtils.js';

/**
 * @param {{
 *   patterns: object[],
 *   type: 'morning'|'evening',
 *   onSubmit: (input: { type: string, content: object, patternIds: string[] }) => Promise<void>,
 *   busy?: boolean,
 *   disabled?: boolean
 * }} props
 */
export default function ReflectionForm({ patterns, type, onSubmit, busy = false, disabled = false }) {
  const formId = useId();
  const prompt = REFLECTION_PROMPTS[type];
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(prompt.fields.map((f) => [f.key, '']))
  );
  const [patternIds, setPatternIds] = useState([]);
  const [formError, setFormError] = useState('');

  function updateField(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function togglePattern(id) {
    setPatternIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const content = { answers };
    const text = reflectionPlainText(content);

    if (text.split(/\s+/).filter(Boolean).length < 10) {
      setFormError('Escreva pelo menos 10 palavras no total.');
      return;
    }

    try {
      await onSubmit({ type, content, patternIds });
      setAnswers(Object.fromEntries(prompt.fields.map((f) => [f.key, ''])));
      setPatternIds([]);
    } catch {
      // erro tratado no hook
    }
  }

  return (
    <form className="card reflection-form" onSubmit={handleSubmit} aria-labelledby={`${formId}-title`}>
      <h3 id={`${formId}-title`}>{prompt.title}</h3>
      <p className="muted">{prompt.intro}</p>

      {prompt.fields.map((field) => {
        const fieldId = `${formId}-${field.key}`;
        return (
          <div className="form-field" key={field.key}>
            <label htmlFor={fieldId}>{field.label}</label>
            <textarea
              id={fieldId}
              rows={3}
              value={answers[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled || busy}
            />
          </div>
        );
      })}

      <fieldset className="pattern-picker">
        <legend>Padrões acionados hoje (opcional)</legend>
        <div className="pattern-picker-grid">
          {patterns.map((pattern) => (
            <label key={pattern.id} className="pattern-picker-item">
              <input
                type="checkbox"
                checked={patternIds.includes(pattern.id)}
                onChange={() => togglePattern(pattern.id)}
                disabled={disabled || busy}
              />
              <span>
                {pattern.code} — {pattern.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={disabled || busy}>
        {busy ? 'Salvando…' : 'Salvar reflexão'}
      </button>
    </form>
  );
}
