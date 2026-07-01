import { xpProgress } from '../lib/xp.js';

export default function XpBar({ totalXp }) {
  const { level, progress, earnedInLevel, neededForNext, isPhilosopherMode } = xpProgress(totalXp);
  const pct = Math.round(progress * 100);
  const progressLabel = `${pct}% do progresso para o nível ${level + 1}`;

  return (
    <section className="card xp-card" aria-labelledby="xp-heading">
      <div className="xp-header">
        <div>
          <p className="eyebrow" id="xp-heading">
            Nível
          </p>
          <p className="xp-level" aria-label={`Nível atual: ${level}`}>
            {level}
          </p>
        </div>
        <div className="xp-meta">
          <p className="xp-total">{totalXp.toLocaleString('pt-BR')} XP</p>
          {isPhilosopherMode && <span className="badge badge-gold">Modo Filósofo</span>}
        </div>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={progressLabel}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="muted xp-caption">
        {earnedInLevel.toLocaleString('pt-BR')} / {neededForNext.toLocaleString('pt-BR')} XP para o
        próximo nível
      </p>
    </section>
  );
}
