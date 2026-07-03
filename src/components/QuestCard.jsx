import { useState } from 'react';
import { getHabitFramework } from '../lib/habitFrameworks.js';
import { getTraditionLabel, QUEST_TRADITIONS } from '../lib/questPresets.js';
import { getTimeSlotLabel } from '../lib/questTimeSlots.js';
import {
  calculateCurrentStreak,
  evaluatePeriod,
  evolutionProgress,
  hasCompletionToday,
  hasMissToday,
  QUEST_CATEGORIES,
  QUEST_TYPES,
  shouldOfferRecalibration,
  TIER_LABELS,
  xpForCompletion
} from '../lib/quests.js';
import QuestCompletionDialog from './QuestCompletionDialog.jsx';
import QuestMissDialog from './QuestMissDialog.jsx';

/**
 * @param {object} props
 * @param {object} props.item
 * @param {(payload: object) => Promise<object|null>} props.onComplete
 * @param {(quest: object, version: object) => Promise<void>} props.onRecalibrate
 * @param {(questId: string) => Promise<void>} props.onRemove
 * @param {(item: object) => void} [props.onOpenMiss]
 * @param {(reason: { code: string, label: string }) => Promise<void>} [props.onRecordMiss]
 * @param {boolean} [props.hasLinkedCard]
 * @param {(quest: object, version: object) => Promise<void>} [props.onCreateFlashcard]
 */
export default function QuestCard({
  item,
  onComplete,
  onRecalibrate,
  onRemove,
  onSimulatePeriodReview,
  onOpenMiss,
  onRecordMiss,
  hasLinkedCard,
  onCreateFlashcard
}) {
  const { quest, version, completions } = item;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [missOpen, setMissOpen] = useState(false);
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
  const period = evaluatePeriod(completions, quest, version);
  const progress = evolutionProgress(completions, quest, version);
  const progressPct = Math.round(progress * 100);
  const ratePct = Math.round(period.rate * 100);
  const thresholdPct = Math.round(period.threshold * 100);
  const canRecalibrate = shouldOfferRecalibration(completions, quest.quest_type, version.tier);
  const xpReward = xpForCompletion(quest.quest_type, version.tier);
  const completedToday = hasCompletionToday(completions);
  const missedToday = hasMissToday(completions);
  const isDaily = quest.quest_type === 'daily';
  const timeSlot = version.definition?.timeSlot ?? 'anytime';
  const habitFramework = getHabitFramework(version.definition?.framework);
  const showFramework = version.definition?.framework && version.definition.framework !== 'custom';
  const traditionId = version.definition?.tradition;
  const traditionLabel = traditionId ? QUEST_TRADITIONS[traditionId]?.label ?? getTraditionLabel({ tradition: traditionId }) : null;
  const presetSource = version.definition?.source;
  const isDev = import.meta.env.DEV;

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

  async function handleSimulate(passed) {
    if (!onSimulatePeriodReview) return;
    const label = passed ? 'aprovado' : 'reprovado';
    if (!window.confirm(`Simular fim do ciclo (${label})? Isso apaga as conclusões atuais desta quest.`)) {
      return;
    }
    setBusy(true);
    try {
      await onSimulatePeriodReview(quest, version, passed);
    } finally {
      setBusy(false);
    }
  }

  async function handleMiss(reason) {
    if (onRecordMiss) {
      await onRecordMiss(reason);
    }
    setMissOpen(false);
  }

  function handleOpenMiss() {
    if (onOpenMiss) {
      onOpenMiss(item);
      return;
    }
    setMissOpen(true);
  }

  async function handleCreateFlashcard() {
    if (!onCreateFlashcard) return;
    setBusy(true);
    try {
      await onCreateFlashcard(quest, version);
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
              {isDaily && timeSlot !== 'anytime' ? ` · ${getTimeSlotLabel(timeSlot)}` : ''}
              {showFramework ? ` · ${habitFramework.label}` : ''}
            </p>
          </div>
          <span className="badge badge-tier badge-active" aria-label={`Tier ${version.tier}: ${TIER_LABELS[version.tier]}`}>
            <span className="badge-tier-mark">T{version.tier}</span>
            <span className="badge-tier-name">{TIER_LABELS[version.tier]}</span>
          </span>
        </header>

        <p className="quest-target">{version.definition?.target}</p>

        {presetSource && (
          <p className="quest-preset-source muted">
            {traditionLabel ? `${traditionLabel} · ` : ''}
            {presetSource}
          </p>
        )}

        <p className="quest-period muted">
          {period.ended ? (
            <span className="quest-period-ended">Ciclo encerrado — revisão pendente</span>
          ) : (
            <>
              Ciclo: {period.daysRemaining} dia{period.daysRemaining === 1 ? '' : 's'} restante
              {period.daysRemaining === 1 ? '' : 's'} · meta {thresholdPct}%
            </>
          )}
        </p>

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
            <dd aria-label={`Progresso do ciclo: ${ratePct}% de ${thresholdPct}%`}>
              {ratePct}% / {thresholdPct}%
            </dd>
          </div>
        </dl>

        <div
          className="progress-track quest-progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso do ciclo: ${progressPct}%`}
        >
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="quest-actions">
          {isDaily && !completedToday && !missedToday && (
            <>
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                aria-disabled={busy}
                onClick={() => setDialogOpen(true)}
              >
                Concluir
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={busy}
                onClick={handleOpenMiss}
              >
                Não fiz hoje
              </button>
            </>
          )}

          {(!isDaily || completedToday) && (
            <button
              type="button"
              className="btn-primary"
              disabled={completedToday || busy}
              aria-disabled={completedToday || busy}
              onClick={() => setDialogOpen(true)}
            >
              {completedToday ? 'Concluída hoje' : 'Concluir'}
            </button>
          )}

          {isDaily && missedToday && (
            <p className="quest-miss-today muted" role="status">
              Registrado como não feito hoje
            </p>
          )}

          {onCreateFlashcard && (
            <div className="quest-card-flashcard-action">
              <button
                type="button"
                className="btn-ghost"
                disabled={busy || hasLinkedCard}
                onClick={handleCreateFlashcard}
              >
                {hasLinkedCard ? 'Card criado' : 'Criar card (opcional)'}
              </button>
              {!hasLinkedCard && (
                <p className="muted quest-card-flashcard-hint">
                  Opcional — fixa o princípio na aba Cards. A quest do dia não depende disso.
                </p>
              )}
            </div>
          )}

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

          {isDev && onSimulatePeriodReview && (
            <div className="dev-tools" aria-label="Ferramentas de desenvolvimento">
              <p className="dev-tools-label muted">Dev: simular revisão de ciclo</p>
              <div className="dev-tools-actions">
                <button
                  type="button"
                  className="btn-ghost btn-ghost-sm"
                  disabled={busy}
                  onClick={() => handleSimulate(true)}
                >
                  Aprovado
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-ghost-sm"
                  disabled={busy}
                  onClick={() => handleSimulate(false)}
                >
                  Reprovado
                </button>
              </div>
            </div>
          )}
        </div>
      </article>

      <QuestCompletionDialog
        open={dialogOpen}
        quest={quest}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleComplete}
      />

      {!onOpenMiss && (
        <QuestMissDialog
          open={missOpen}
          quest={quest}
          version={version}
          onClose={() => setMissOpen(false)}
          onSubmit={handleMiss}
        />
      )}
    </>
  );
}
