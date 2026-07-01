import { getMissReasonSet } from '../lib/questMissReasons.js';
import ModalDialog from './ModalDialog.jsx';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {object} props.quest
 * @param {object} props.version
 * @param {() => void} props.onClose
 * @param {(reason: { code: string, label: string }) => Promise<void>} props.onSubmit
 */
export default function QuestMissDialog({ open, quest, version, onClose, onSubmit }) {
  if (!quest || !version) return null;

  const reasonSet = getMissReasonSet(quest, version);

  async function handlePick(option) {
    await onSubmit(option);
    onClose();
  }

  return (
    <ModalDialog open={open} title="Não fiz hoje" onClose={onClose}>
      <div className="quest-miss-dialog">
        <p className="quest-miss-question">{reasonSet.question}</p>
        <div className="miss-reason-list" role="list">
          {reasonSet.options.map((option) => (
            <button
              key={option.code}
              type="button"
              className="miss-reason-btn"
              onClick={() => handlePick(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </ModalDialog>
  );
}
