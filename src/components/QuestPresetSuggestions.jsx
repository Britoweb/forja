import { useMemo, useState } from 'react';
import { declinePreset, getDeclinedPresetIds } from '../lib/presetDeclines.js';
import {
  getAvailablePresets,
  getTraditionLabel,
  groupPresetsByTradition,
  presetToQuestInput,
  QUEST_TRADITIONS,
  TRADITION_ORDER
} from '../lib/questPresets.js';
import { getTimeSlotLabel } from '../lib/questTimeSlots.js';
import QuestPresetAdjustDialog from './QuestPresetAdjustDialog.jsx';

/**
 * @param {object} props
 * @param {object[]} props.items
 * @param {(input: object) => Promise<void>} props.onAdd
 */
export default function QuestPresetSuggestions({ items, onAdd }) {
  const [declinedIds, setDeclinedIds] = useState(() => getDeclinedPresetIds());
  const [adjustPreset, setAdjustPreset] = useState(null);
  const [expandedTraditions, setExpandedTraditions] = useState(() => new Set(['stoicism']));

  const available = useMemo(
    () => getAvailablePresets(items, declinedIds),
    [items, declinedIds]
  );
  const grouped = useMemo(() => groupPresetsByTradition(available), [available]);

  if (!available.length) return null;

  function handleDecline(presetId) {
    declinePreset(presetId);
    setDeclinedIds(getDeclinedPresetIds());
  }

  function toggleTradition(id) {
    setExpandedTraditions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <section className="card quest-presets" aria-labelledby="quest-presets-heading">
        <h2 id="quest-presets-heading">Quests presetadas</h2>
        <p className="muted quest-presets-intro">
          Exercícios de filosofia, psicologia e neurociência — aceite, ajuste ou recuse cada um.
        </p>

        {TRADITION_ORDER.map((traditionId) => {
          const presets = grouped[traditionId] ?? [];
          if (!presets.length) return null;

          const tradition = QUEST_TRADITIONS[traditionId];
          const expanded = expandedTraditions.has(traditionId);

          return (
            <div key={traditionId} className="preset-tradition-group">
              <button
                type="button"
                className="preset-tradition-toggle"
                aria-expanded={expanded}
                onClick={() => toggleTradition(traditionId)}
              >
                <span>
                  <strong>{tradition.label}</strong>
                  <span className="muted"> · {presets.length} disponível{presets.length === 1 ? '' : 'eis'}</span>
                </span>
                <span aria-hidden="true">{expanded ? '−' : '+'}</span>
              </button>

              {expanded && (
                <>
                  <p className="muted preset-tradition-desc">{tradition.description}</p>
                  <ul className="preset-list" role="list">
                    {presets.map((preset) => (
                      <li key={preset.id}>
                        <article className="preset-card">
                          <div className="preset-card-body">
                            <h3>{preset.title}</h3>
                            <p className="preset-source muted">{preset.source}</p>
                            <p className="preset-desc">{preset.description}</p>
                            <p className="preset-meta muted">
                              {getTimeSlotLabel(preset.timeSlot)}
                              {preset.wakeDependent ? ' · acordar cedo' : ''}
                              {' · '}
                              {getTraditionLabel(preset)}
                            </p>
                          </div>
                          <div className="preset-actions">
                            <button
                              type="button"
                              className="btn-primary preset-accept-btn"
                              onClick={() => onAdd(presetToQuestInput(preset))}
                            >
                              Aceitar
                            </button>
                            <button
                              type="button"
                              className="btn-ghost btn-ghost-sm"
                              onClick={() => setAdjustPreset(preset)}
                            >
                              Ajustar
                            </button>
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => handleDecline(preset.id)}
                            >
                              Recusar
                            </button>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </section>

      <QuestPresetAdjustDialog
        open={Boolean(adjustPreset)}
        preset={adjustPreset}
        onClose={() => setAdjustPreset(null)}
        onSubmit={onAdd}
      />
    </>
  );
}
