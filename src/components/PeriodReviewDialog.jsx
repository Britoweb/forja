import {
  formatRatePercent,
  formatThresholdPercent,
  getHabitFramework
} from '../lib/habitFrameworks.js';
import { buildEvolvedDefinition, TIER_LABELS } from '../lib/quests.js';
import ModalDialog from './ModalDialog.jsx';

/**
 * @param {object} props
 * @param {object|null} props.review
 * @param {boolean} props.busy
 * @param {() => void} props.onDismiss
 * @param {() => void} props.onEvolve
 * @param {() => void} props.onRestart
 * @param {() => void} props.onArchive
 */
export default function PeriodReviewDialog({
  review,
  busy,
  onDismiss,
  onEvolve,
  onRestart,
  onArchive
}) {
  if (!review) return null;

  const { quest, version, evaluation } = review;
  const framework = getHabitFramework(evaluation.frameworkId);
  const nextTier = version.tier + 1;
  const suggestedDefinition =
    evaluation.canEvolve && nextTier <= 3
      ? buildEvolvedDefinition(version.definition, nextTier, quest.quest_type)
      : null;

  const title = evaluation.atMastery
    ? 'Hábito consolidado'
    : evaluation.passed
      ? 'Ciclo concluído com sucesso'
      : 'Ciclo encerrado';

  return (
    <ModalDialog open={Boolean(review)} title={title} onClose={onDismiss}>
      <div className="period-review" role="status">
        <p>
          O ciclo de <strong>{evaluation.periodDays} dias</strong> de{' '}
          <strong>{quest.title}</strong> terminou.
        </p>

        <dl className="period-review-stats">
          <div>
            <dt>Abordagem</dt>
            <dd>{framework.label}</dd>
          </div>
          <div>
            <dt>Conclusões</dt>
            <dd>
              {evaluation.actual} de {evaluation.expected}
            </dd>
          </div>
          <div>
            <dt>Taxa alcançada</dt>
            <dd>{formatRatePercent(evaluation.rate)}</dd>
          </div>
          <div>
            <dt>Meta do modelo</dt>
            <dd>{formatThresholdPercent(evaluation.threshold)}</dd>
          </div>
        </dl>

        {evaluation.canEvolve && (
          <>
            <p className="period-review-verdict period-review-verdict--pass">
              Você atingiu a consistência necessária para evoluir de{' '}
              <strong>{TIER_LABELS[version.tier]}</strong> para{' '}
              <strong>{TIER_LABELS[nextTier]}</strong>.
            </p>
            {suggestedDefinition?.target && (
              <p className="muted">Próxima meta sugerida: {suggestedDefinition.target}</p>
            )}
            <div className="form-actions">
              <button type="button" className="btn-ghost" disabled={busy} onClick={onDismiss}>
                Decidir depois
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={onEvolve}>
                {busy ? 'Evoluindo…' : 'Evoluir quest'}
              </button>
            </div>
          </>
        )}

        {evaluation.atMastery && (
          <>
            <p className="period-review-verdict period-review-verdict--pass">
              Você completou os três tiers com consistência real. Este hábito pode ser considerado
              consolidado.
            </p>
            <div className="form-actions">
              <button type="button" className="btn-ghost" disabled={busy} onClick={onDismiss}>
                Continuar rastreando
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={onArchive}>
                Arquivar quest
              </button>
            </div>
          </>
        )}

        {evaluation.canRestart && (
          <>
            <p className="period-review-verdict period-review-verdict--fail">
              A taxa de {formatRatePercent(evaluation.rate)} ficou abaixo dos{' '}
              {formatThresholdPercent(evaluation.threshold)} exigidos para{' '}
              <strong>{framework.label}</strong>. Isso não é fracasso — é dado para recalibrar.
            </p>
            <p className="muted">
              Recomeçar inicia um novo ciclo de {evaluation.periodDays} dias no mesmo tier, mantendo
              a mesma meta.
            </p>
            <div className="form-actions">
              <button type="button" className="btn-ghost" disabled={busy} onClick={onArchive}>
                Arquivar
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={onRestart}>
                {busy ? 'Reiniciando…' : 'Recomeçar ciclo'}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalDialog>
  );
}
