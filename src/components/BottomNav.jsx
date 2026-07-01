import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchDueFlashcardCount } from '../lib/api/flashcards.js';
import { fetchUnresolvedFlagCount } from '../lib/api/flags.js';

const NAV_ITEMS = [
  { to: '/', label: 'Início', end: true },
  { to: '/quests', label: 'Quests', end: false },
  { to: '/flashcards', label: 'Cards', end: false, showDue: true },
  { to: '/reflections', label: 'Diário', end: false },
  { to: '/report', label: 'Relatório', end: false, showFlags: true }
];

export default function BottomNav() {
  const { user } = useAuth();
  const [dueCards, setDueCards] = useState(0);
  const [openFlags, setOpenFlags] = useState(0);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      fetchDueFlashcardCount(user.id)
        .then(setDueCards)
        .catch(() => setDueCards(0));
      fetchUnresolvedFlagCount(user.id)
        .then(setOpenFlags)
        .catch(() => setOpenFlags(0));
    }

    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <ul role="list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'bottom-nav-link active' : 'bottom-nav-link'
              }
            >
              <span className="bottom-nav-icon" aria-hidden="true">
                {item.label[0]}
                {item.showDue && dueCards > 0 && (
                  <span className="bottom-nav-badge">{dueCards > 9 ? '9+' : dueCards}</span>
                )}
                {item.showFlags && openFlags > 0 && (
                  <span className="bottom-nav-badge bottom-nav-badge-flag">
                    {openFlags > 9 ? '9+' : openFlags}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
