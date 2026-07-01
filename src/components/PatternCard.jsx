const STATUS_LABELS = {
  active: 'Ativo',
  consolidated: 'Consolidado',
  archived: 'Arquivado'
};

export default function PatternCard({ pattern }) {
  return (
    <article className="card pattern-card">
      <header className="pattern-header">
        <span className="pattern-code">{pattern.code}</span>
        <span className={`badge badge-${pattern.status}`}>{STATUS_LABELS[pattern.status]}</span>
      </header>
      <h3>{pattern.name}</h3>
      <p className="pattern-description">{pattern.description}</p>
      {pattern.target_behavior && (
        <p className="pattern-target">
          <span className="eyebrow">Comportamento-alvo</span>
          {pattern.target_behavior}
        </p>
      )}
    </article>
  );
}
