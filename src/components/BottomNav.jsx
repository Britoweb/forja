import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Início', end: true },
  { to: '/quests', label: 'Quests', end: false }
];

export default function BottomNav() {
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
              <span aria-hidden="true">{item.label[0]}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
