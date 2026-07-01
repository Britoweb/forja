import { useState } from 'react';
import {
  calculateCurrentStreak,
  evolutionProgress,
  QUEST_CATEGORIES,
  QUEST_TYPES,
  shouldOfferRecalibration,
  TIER_LABELS,
  xpForCompletion
} from '../lib/quests.js';
import QuestCompletionDialog from './QuestCompletionDialog.jsx';

/**
 * @param {object} props
 * @param {object} props.item
 * @param {(payload: object) => Promise<object|null>} props.onComplete
 * @param {(quest: object, version: object) => Promise<void>} props.onRecalibrate
 * @param {(questId: string) => Promise<void>} props.onRemove
 */
export default function QuestCard({ item, onComplete, onRecalibrate, onRemove }) {
  const { quest, version, completions } = item;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!version) {
    return (
      <article className="card quest-card">
        <h3>{quest.title}</h3>
        <p className="form-error">Quest sem versão ativa.</p>
      </article>
    );
  }

  const streak = calculateCurrentStreak(completions, quest.quest_type);
  const progress = evolutionProgress(completions, quest.quest_type, version.streak_required_to_evolve);
  const progressPct = Math.round(progress * 100);
  const canRecalibrate = shouldOfferRecalibration(completions, quest.quest_type, version.tier);
  const xpReward = xpForCompletion(quest.quest_type, version.tier);
  const completedToday = completions.some(
    (c) => new Date(c.completed_at).toDateString() === new Date().toDateString()
  );

  async function handleComplete(payload) {
    setBusy(true);
    try {
      await onComplete({
        quest,
        version,
        completions,
        ...payload
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRecalibrate() {
    setBusy(true);
    try {
      await onRecalibrate(quest, version);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <article className="card quest-card" aria-labelledby={`quest-${quest.id}`}>
        <header className="quest-card-header">
          <div>
            <h3 id={`quest-${quest.id}`}>{quest.title}</h3>
            <p className="quest-meta muted">
              {QUEST_CATEGORIES[quest.category]} · {QUEST_TYPES[quest.quest_type]}
            </p>
          </div>
          <span className="badge badge-active" aria-label={`Tier ${version.tier}: ${TIER_LABELS[version.tier]}`}>
            T{version.tier} · {TIER_LABELS[version.tier]}
          </span>
        </header>

        <p className="quest-target">{version.definition?.target}</p>

        <dl className="quest-stats">
          <div>
            <dt>Streak</dt>
            <dd aria-label={`Streak atual: ${streak}`}>{streak}</dd>
          </div>
          <div>
            <dt>XP</dt>
            <dd>+{xpReward}</dd>
          </div>
          <div>
            <dt>Evolução</dt>
            <dd aria-label={`Progresso para evoluir: ${progressPct} por cento`}>{progressPct}%</dd>
          </div>
        </dl>

        <div
          className="progress-track quest-progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso de evolução: ${progressPct}%`}
        >
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="quest-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={completedToday || busy}
            aria-disabled={completedToday || busy}
            onClick={() => setDialogOpen(true)}
          >
            {completedToday ? 'Concluída hoje' : 'Concluir'}
          </button>

          {canRecalibrate && version.tier >= 2 && (
            <button type="button" className="btn-ghost" disabled={busy} onClick={handleRecalibrate}>
              Recalibrar tier
            </button>
          )}

          <button
            type="button"
            className="btn-link btn-link-danger"
            disabled={busy}
            onClick={() => onRemove(quest.id)}
          >
            Arquivar
          </button>
        </div>
      </article>

      <QuestCompletionDialog
        open={dialogOpen}
        quest={quest}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleComplete}
      />
    </>
  );
}
