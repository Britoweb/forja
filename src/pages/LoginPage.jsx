import { useId, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { session, signIn, signUp } = useAuth();
  const location = useLocation();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname ?? '/';
  const hasError = Boolean(error);

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        setMessage('Conta criada. Se o e-mail exigir confirmação, verifique sua caixa de entrada.');
      }
    } catch (err) {
      setError(err.message ?? 'Não foi possível autenticar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel card">
        <div className="auth-brand">
          <span className="brand-mark brand-mark-lg" aria-hidden="true">
            F
          </span>
          <h1>Forja</h1>
          <p className="muted">Integridade pessoal, não pontos vazios.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor={emailId}>E-mail</label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor={passwordId}>Senha</label>
            <input
              id={passwordId}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              aria-required="true"
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : undefined}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p id={errorId} className="form-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="form-success" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            aria-disabled={submitting}
          >
            {submitting ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          className="btn-link"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setMessage('');
          }}
        >
          {mode === 'login' ? 'Criar uma conta' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  );
}
