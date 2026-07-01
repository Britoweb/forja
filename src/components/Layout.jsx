import { Outlet } from 'react-router-dom';
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
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            F
          </span>
          <span className="brand-name">Forja</span>
        </div>
        <button type="button" className="btn-ghost" onClick={() => signOut()}>
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
