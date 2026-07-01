import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import { initSync } from './lib/sync.js';
import { isSupabaseConfigured } from './lib/supabaseClient.js';
import ConfigSetupPage from './pages/ConfigSetupPage.jsx';
import './index.css';

const root = createRoot(document.getElementById('root'));

if (!isSupabaseConfigured) {
  root.render(
    <StrictMode>
      <ConfigSetupPage />
    </StrictMode>
  );
} else {
  initSync();
  root.render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
