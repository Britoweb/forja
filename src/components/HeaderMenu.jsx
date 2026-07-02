import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../lib/navItems.js';

/**
 * @param {{ dueCards: number, openFlags: number }} props
 */
export default function HeaderMenu({ dueCards, openFlags }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const panelId = useId();
  const toggleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function badgeFor(item) {
    if (item.showDue && dueCards > 0) return dueCards > 9 ? '9+' : dueCards;
    if (item.showFlags && openFlags > 0) return openFlags > 9 ? '9+' : openFlags;
    return null;
  }

  return (
    <div className="header-menu">
      <button
        id={toggleId}
        type="button"
        className="btn-ghost header-menu-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="header-menu-toggle-icon" aria-hidden="true">
          ☰
        </span>
        <span>Menu</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="header-menu-backdrop"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id={panelId}
            className="header-menu-panel"
            aria-label="Navegação principal"
            aria-labelledby={toggleId}
          >
            <ul role="list">
              {NAV_ITEMS.map((item) => {
                const badge = badgeFor(item);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive ? 'header-menu-link active' : 'header-menu-link'
                      }
                      onClick={() => setOpen(false)}
                    >
                      <span>{item.label}</span>
                      {badge && (
                        <span className="header-menu-badge" aria-label={`${badge} pendente(s)`}>
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
