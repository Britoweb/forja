// Algoritmo SM-2 (SuperMemo 2) — mesmo algoritmo usado pelo Anki como base.
// Ver docs/SPEC.md seção 6.
//
// quality: 0-5, qualidade da resposta do usuário na revisão
//   0-2 = errou / não lembrou
//   3-5 = acertou, com confiança crescente
//
// Recebe o estado atual do card e retorna o novo estado.

export function sm2({ easeFactor, intervalDays, repetitions }, quality) {
  let newEaseFactor = easeFactor;
  let newInterval = intervalDays;
  let newRepetitions = repetitions;

  if (quality < 3) {
    // Errou: reseta repetições, intervalo curto, mas NÃO reseta o ease factor
    // inteiro (isso penalizaria demais um erro isolado).
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * easeFactor);
    }

    newEaseFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    easeFactor: Number(newEaseFactor.toFixed(2)),
    intervalDays: newInterval,
    repetitions: newRepetitions,
    nextReviewAt: nextReviewAt.toISOString()
  };
}
