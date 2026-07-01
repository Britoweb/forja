export default function ConfigSetupPage() {
  return (
    <div className="config-screen">
      <div className="config-panel card">
        <span className="brand-mark brand-mark-lg" aria-hidden="true">
          F
        </span>
        <h1>Configuração necessária</h1>
        <p className="muted">
          O Forja precisa de um projeto Supabase antes de iniciar. A tela ficou em branco porque o
          arquivo <code>.env</code> ainda não existe ou está incompleto.
        </p>
        <ol className="config-steps">
          <li>
            Crie um projeto em{' '}
            <a href="https://supabase.com" target="_blank" rel="noreferrer">
              supabase.com
            </a>
          </li>
          <li>
            Copie <code>.env.example</code> para <code>.env</code>
          </li>
          <li>
            Em Project Settings → API, cole a URL e a <code>anon key</code> no <code>.env</code>
          </li>
          <li>
            No SQL Editor do Supabase, rode <code>schema.sql</code> (e opcionalmente{' '}
            <code>schema-onboarding.sql</code>)
          </li>
          <li>Reinicie o servidor: pare com Ctrl+C e rode <code>npm run dev</code> de novo</li>
        </ol>
        <pre className="config-example" aria-label="Exemplo de arquivo .env">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
      </div>
    </div>
  );
}
