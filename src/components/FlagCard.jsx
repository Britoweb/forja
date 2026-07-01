import { useId, useState } from 'react';
import { RULE_LABELS, SEVERITY_LABELS } from '../lib/api/report.js';
import { reflectionPlainText } from '../lib/detection/textUtils.js';
import { REFLECTION_TYPE_LABELS } from '../lib/reflectionPrompts.js';

/**
 * @param {{ flag: object, onResolve: (id: string, explanation: string) => Promise<void> }} props
 */
export default function FlagCard({ flag, onResolve }) {
  const dialogId = useId();
  const explanationId = useId();
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [busy, setBusy] = useState(false);

  const data = flag.related_data ?? {};
  const ruleLabel = RULE_LABELS[flag.rule_triggered] ?? flag.rule_triggered;
  const severityLabel = SEVERITY_LABELS[flag.severity] ?? flag.severity;

  async function handleResolve(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onResolve(flag.id, explanation);
      setOpen(false);
      setExplanation('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`card flag-card flag-severity-${flag.severity}${flag.resolved ? ' flag-resolved' : ''}`}
    >
      <header className="flag-card-header">
        <div>
          <h3>{ruleLabel}</h3>
          <p className="muted flag-meta">
            <span
              className={`flag-severity-badge severity-${flag.severity}`}
              aria-label={`Severidade ${severityLabel}`}
            >
              {severityLabel}
            </span>
            {data.date_range && <span> · {data.date_range}</span>}
            {data.pattern && <span> · {data.pattern}</span>}
          </p>
        </div>
        {flag.resolved && <span className="flag-status-resolved">Resolvido</span>}
      </header>

      <p>{data.description}</p>

      {data.suggested_question && (
        <p className="flag-suggested">
          <strong>Pergunta sugerida:</strong> {data.suggested_question}
        </p>
      )}

      {flag.user_explanation && (
        <p className="flag-explanation">
          <strong>Sua explicação:</strong> {flag.user_explanation}
        </p>
      )}

      {!flag.resolved && (
        <>
          <button type="button" className="btn-ghost btn-inline" onClick={() => setOpen(true)}>
            Explicar / resolver
          </button>

          {open && (
            <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
              <div
                className="modal flag-resolve-modal"
                role="dialog"
                aria-labelledby={dialogId}
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id={dialogId}>Resolver flag</h2>
                <p className="muted">{data.description}</p>
                <form onSubmit={handleResolve}>
                  <div className="form-field">
                    <label htmlFor={explanationId}>Sua explicação (opcional)</label>
                    <textarea
                      id={explanationId}
                      rows={4}
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="Contexto que o sistema não captou…"
                      disabled={busy}
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={busy}>
                      {busy ? 'Salvando…' : 'Marcar como resolvido'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}

/**
 * @param {{ reflection: object }} props
 */
export function ReflectionHistoryItem({ reflection }) {
  const text = reflectionPlainText(reflection.content);
  const typeLabel = REFLECTION_TYPE_LABELS[reflection.type] ?? reflection.type;
  const date = new Date(reflection.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <article className="card reflection-history-item">
      <header className="reflection-history-header">
        <strong>{typeLabel}</strong>
        <time dateTime={reflection.created_at}>{date}</time>
      </header>
      <p className="reflection-excerpt">{text.slice(0, 280)}{text.length > 280 ? '…' : ''}</p>
    </article>
  );
}
