import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BottomNav from './BottomNav.jsx';
import HeaderMenu from './HeaderMenu.jsx';
import OfflineBanner from './OfflineBanner.jsx';
import { useNavBadges } from '../hooks/useNavBadges.js';

export default function Layout() {
  const { signOut } = useAuth();
  const { dueCards, openFlags } = useNavBadges();

  return (
    <div className="app-shell">
      <a href="#conteudo-principal" className="skip-link">
        Pular para conteúdo
      </a>
      <OfflineBanner />
      <header className="app-header">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden="true">
            F
          </span>
          <span className="brand-name">Forja</span>
        </NavLink>
        <div className="app-header-actions">
          <HeaderMenu dueCards={dueCards} openFlags={openFlags} />
          <button type="button" className="btn-ghost btn-ghost-sm header-signout" onClick={() => signOut()}>
            Sair
          </button>
        </div>
      </header>
      <main id="conteudo-principal" className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
