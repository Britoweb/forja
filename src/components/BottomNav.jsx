import { NavLink } from 'react-router-dom';
import { useNavBadges } from '../hooks/useNavBadges.js';
import { NAV_ITEMS } from '../lib/navItems.js';

export default function BottomNav() {
  const { dueCards, openFlags } = useNavBadges();

  return (
    <nav className="bottom-nav" aria-label="Navegação inferior">
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
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
