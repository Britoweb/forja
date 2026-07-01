/** Botões de revisão — mapeiam para qualidade SM-2 (0–5). */
export const REVIEW_BUTTONS = [
  { quality: 0, label: 'De novo', hint: 'Não lembrei' },
  { quality: 3, label: 'Difícil', hint: 'Com esforço' },
  { quality: 4, label: 'Bom', hint: 'Lembrei bem' },
  { quality: 5, label: 'Fácil', hint: 'Imediato' }
];

/** @type {{ front: string, back: string, patternCode?: string, source: string }[]} */
export const STARTER_FLASHCARDS = [
  {
    front: 'Errei em algo específico hoje.',
    back: 'Um erro pontual não define quem sou. O que posso corrigir com ação concreta?',
    patternCode: 'A',
    source: 'manual'
  },
  {
    front: 'Estou sendo duro comigo mesmo.',
    back: 'Trataria um amigo assim? Compaixão não é fraqueza — é justiça.',
    patternCode: 'B',
    source: 'manual'
  },
  {
    front: 'Minha dor é diferente da dos outros.',
    back: 'Sofrimento é humano. As mesmas leis que aplico ao mundo aplicam-se a mim.',
    patternCode: 'C',
    source: 'manual'
  },
  {
    front: 'Isto está no meu controle?',
    back: 'Só minhas escolhas, julgamentos e ações são minhas. O resto, aceito e sigo.',
    source: 'manual'
  }
];
