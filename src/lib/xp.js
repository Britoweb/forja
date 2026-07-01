/**
 * Cálculo de nível a partir do XP total — ver docs/SPEC.md seção 4.
 */

export function xpForLevel(level) {
  if (level <= 1) return 0;
  if (level <= 100) return 100 * (level - 1);
  return Math.floor(100 * 100 * Math.pow(1.05, level - 100));
}

export function levelFromXp(totalXp) {
  if (totalXp <= 0) return 1;

  let level = 1;
  while (xpForLevel(level + 1) <= totalXp && level < 10000) {
    level += 1;
  }
  return level;
}

export function xpProgress(totalXp) {
  const level = levelFromXp(totalXp);
  const currentLevelFloor = xpForLevel(level);
  const nextLevelFloor = xpForLevel(level + 1);
  const span = nextLevelFloor - currentLevelFloor;
  const earned = totalXp - currentLevelFloor;

  return {
    level,
    totalXp,
    currentLevelFloor,
    nextLevelFloor,
    earnedInLevel: earned,
    neededForNext: span,
    progress: span > 0 ? earned / span : 1,
    isPhilosopherMode: level >= 100
  };
}
