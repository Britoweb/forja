import { useEffect, useId, useRef, useState } from 'react';
import ModalDialog from './ModalDialog.jsx';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {object} props.quest
 * @param {() => void} props.onClose
 * @param {(payload: object) => Promise<void>} props.onSubmit
 */
export default function QuestCompletionDialog({ open, quest, onClose, onSubmit }) {
  const evidenceId = useId();
  const errorId = useId();
  const openedAtRef = useRef(null);
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      openedAtRef.current = new Date().toISOString();
      setEvidence('');
      setError('');
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (evidence.trim().length < 5) {
      setError('Descreva o que foi feito com pelo menos 5 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        evidenceText: evidence.trim(),
        openedAt: openedAtRef.current
      });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Não foi possível registrar a conclusão.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalDialog open={open} title={`Concluir: ${quest?.title ?? ''}`} onClose={onClose}>
      <form className="quest-form" onSubmit={handleSubmit}>
        <p className="muted">Registre evidência do que foi feito. Seja específico — datas, números ou nomes.</p>
        <div className="form-field">
          <label htmlFor={evidenceId}>Evidência</label>
          <textarea
            id={evidenceId}
            rows={4}
            required
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Ex.: Treinei 45 min, 3 séries de agachamento com 80 kg."
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
          <button type="submit" className="btn-primary" disabled={submitting} aria-disabled={submitting}>
            {submitting ? 'Salvando…' : 'Registrar conclusão'}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
