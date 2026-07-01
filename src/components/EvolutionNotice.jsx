import { TIER_LABELS } from '../lib/quests.js';
import ModalDialog from './ModalDialog.jsx';

/**
 * @param {object} props
 * @param {object|null} props.evolution
 * @param {() => void} props.onDismiss
 */
export default function EvolutionNotice({ evolution, onDismiss }) {
  if (!evolution) return null;

  return (
    <ModalDialog open={Boolean(evolution)} title="Quest evoluiu!" onClose={onDismiss}>
      <div className="evolution-notice" role="status">
        <p>
          <strong>{evolution.questTitle}</strong> subiu de{' '}
          <span>{TIER_LABELS[evolution.previousTier]}</span> para{' '}
          <span>{TIER_LABELS[evolution.newTier]}</span>.
        </p>
        <p className="muted">Nova meta: {evolution.newVersion?.definition?.target}</p>
        <button type="button" className="btn-primary" onClick={onDismiss}>
          Continuar
        </button>
      </div>
    </ModalDialog>
  );
}
