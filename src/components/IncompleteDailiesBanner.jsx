import { DAILY_CHECKIN_HOUR } from '../lib/questTimeSlots.js';
import { getTimeSlotLabel } from '../lib/questTimeSlots.js';
import { isDailyPendingToday } from '../lib/quests.js';

/**
 * @param {object} props
 * @param {object[]} props.items
 * @param {(item: object) => void} props.onRegisterMiss
 */
export default function IncompleteDailiesBanner({ items, onRegisterMiss }) {
  const hour = new Date().getHours();
  if (hour < DAILY_CHECKIN_HOUR) return null;

  const pending = items.filter(
    (item) => item.version && isDailyPendingToday(item.quest, item.completions)
  );

  if (!pending.length) return null;

  return (
    <section className="card incomplete-dailies-banner" aria-labelledby="incomplete-dailies-heading">
      <h2 id="incomplete-dailies-heading">Quests de hoje em aberto</h2>
      <p className="muted">
        Um toque para registrar o que aconteceu — sem texto longo.
      </p>
      <ul className="incomplete-dailies-list" role="list">
        {pending.map((item) => {
          const timeSlot = item.version.definition?.timeSlot ?? 'anytime';
          return (
            <li key={item.quest.id}>
              <button
                type="button"
                className="incomplete-daily-row"
                onClick={() => onRegisterMiss(item)}
              >
                <span className="incomplete-daily-title">{item.quest.title}</span>
                <span className="incomplete-daily-meta muted">
                  {getTimeSlotLabel(timeSlot)} · Não fiz
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
