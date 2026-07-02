import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BottomNav from './BottomNav.jsx';
import OfflineBanner from './OfflineBanner.jsx';

export default function Layout() {
  const { signOut } = useAuth();

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
        <button type="button" className="btn-ghost btn-ghost-sm" onClick={() => signOut()}>
          Sair
        </button>
      </header>
      <main id="conteudo-principal" className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
