import { useMemo } from 'react';
import { groupQuestItemsByTimeSlot } from '../lib/questTimeSlots.js';

/**
 * @param {object} props
 * @param {object[]} props.items
 * @param {(item: object) => import('react').ReactNode} props.renderItem
 */
export default function QuestTimeSlotGroups({ items, renderItem }) {
  const groups = useMemo(() => groupQuestItemsByTimeSlot(items), [items]);

  if (!groups.length) return null;

  return (
    <div className="quests-timeslot-groups">
      {groups.map((group) => (
        <section
          key={group.key}
          className="quests-timeslot-group"
          aria-label={group.label}
        >
          <h3 className="quests-timeslot-title">{group.label}</h3>
          <ul className="quest-list" role="list">
            {group.items.map((item) => (
              <li key={item.quest.id}>{renderItem(item)}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
