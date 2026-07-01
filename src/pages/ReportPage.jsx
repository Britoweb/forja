import { useState } from 'react';
import FlagCard from '../components/FlagCard.jsx';
import { useReport } from '../hooks/useReport.js';

export default function ReportPage() {
  const {
    flags,
    unresolvedCount,
    loading,
    error,
    detecting,
    exporting,
    lastDetection,
    runAnalysis,
    resolve,
    exportReport,
    copyReport
  } = useReport();
  const [copyOk, setCopyOk] = useState(false);
  const [filter, setFilter] = useState('unresolved');

  const visibleFlags = flags.filter((f) => {
    if (filter === 'unresolved') return !f.resolved;
    if (filter === 'resolved') return f.resolved;
    return true;
  });

  async function handleCopy() {
    await copyReport(30);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 2500);
  }

  if (loading) {
    return (
      <div className="screen-center" role="status" aria-live="polite">
        <p className="muted">Carregando relatório…</p>
      </div>
    );
  }

  return (
    <div className="report-page">
      <section className="hero">
        <h1>Relatório</h1>
        <p className="muted">
          Detecção de inconsistências — informativa, não bloqueante. Exporte o JSON para revisão
          periódica com Claude ou com seu psicólogo.
        </p>
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card report-actions">
        <h2 className="report-actions-title">Ações</h2>
        <p className="muted">
          {unresolvedCount > 0
            ? `${unresolvedCount} flag(s) em aberto`
            : 'Nenhum flag em aberto'}
        </p>
        <div className="report-actions-row">
          <button
            type="button"
            className="btn-primary"
            onClick={runAnalysis}
            disabled={detecting || exporting}
          >
            {detecting ? 'Analisando…' : 'Rodar análise'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => exportReport(30)}
            disabled={detecting || exporting}
          >
            {exporting ? 'Exportando…' : 'Baixar JSON (30d)'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={handleCopy}
            disabled={detecting || exporting}
          >
            {copyOk ? 'Copiado!' : 'Copiar JSON'}
          </button>
        </div>
        {lastDetection && (
          <p className="muted report-detection-result" role="status">
            Última análise: {lastDetection.proposedCount} sinal(is) encontrado(s),{' '}
            {lastDetection.insertedCount} novo(s) registrado(s).
          </p>
        )}
      </section>

      <section className="section" aria-labelledby="flags-heading">
        <div className="section-header section-header-row">
          <div>
            <h2 id="flags-heading">Flags de inconsistência</h2>
            <p className="muted">Você pode explicar e marcar como resolvido — isso entra no export.</p>
          </div>
          <div className="report-filter">
            <label htmlFor="flag-filter" className="sr-only">
              Filtrar flags
            </label>
            <select
              id="flag-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="unresolved">Em aberto</option>
              <option value="all">Todos</option>
              <option value="resolved">Resolvidos</option>
            </select>
          </div>
        </div>

        {visibleFlags.length === 0 ? (
          <div className="card empty-state">
            <p className="muted">
              {filter === 'unresolved'
                ? 'Nenhum flag em aberto. Rode a análise após alguns dias de uso com quests e reflexões.'
                : 'Nenhum flag neste filtro.'}
            </p>
          </div>
        ) : (
          <ul className="flag-list" role="list">
            {visibleFlags.map((flag) => (
              <li key={flag.id}>
                <FlagCard flag={flag} onResolve={resolve} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
