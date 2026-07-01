/**
 * Modelos de formação de hábito para guiar a criação de quests.
 * Referências: Tiny Habits (Fogg), Atomic Habits (Clear),
 * Lally et al. 2010 (66 dias), Gollwitzer (implementation intentions).
 */

/** @typedef {'tiny_habits'|'atomic_habits'|'science_66'|'if_then'|'stoic_discipline'|'custom'} HabitFrameworkId */

/**
 * @typedef {object} HabitFrameworkExtraField
 * @property {string} key
 * @property {string} label
 * @property {string} placeholder
 * @property {boolean} [optional]
 */

/**
 * @typedef {object} HabitFramework
 * @property {HabitFrameworkId} id
 * @property {string} label
 * @property {string} source
 * @property {string} description
 * @property {string[]} principles
 * @property {number} streakRequired
 * @property {number} successThreshold
 * @property {string} targetPlaceholder
 * @property {string} validationPlaceholder
 * @property {HabitFrameworkExtraField[]} [extraFields]
 */

/** @type {HabitFramework[]} */
export const HABIT_FRAMEWORKS = [
  {
    id: 'tiny_habits',
    label: 'Começar pequeno',
    source: 'Tiny Habits — BJ Fogg',
    description:
      'Comece com uma versão tão pequena que é impossível falhar. Motivação oscila; gatilho e facilidade não.',
    principles: [
      'Comportamento inicial em menos de 30 segundos',
      'Celebrar imediatamente reforça o circuito',
      'Só aumente depois que o mínimo estiver automático'
    ],
    streakRequired: 14,
    successThreshold: 0.8,
    targetPlaceholder: 'Ex.: calçar o tênis (não "correr 5 km")',
    validationPlaceholder: 'Fiz o mínimo e celebrei, mesmo que brevemente',
    extraFields: [
      {
        key: 'anchor',
        label: 'Gatilho (depois de…)',
        placeholder: 'Ex.: depois do café da manhã'
      },
      {
        key: 'celebration',
        label: 'Celebração',
        placeholder: 'Ex.: sorriso + "consegui!"'
      }
    ]
  },
  {
    id: 'atomic_habits',
    label: 'Construir gradualmente',
    source: 'Atomic Habits — James Clear',
    description:
      'Torne o hábito óbvio, atraente, fácil e satisfatório. Evolua da regra dos 2 minutos até o comportamento completo.',
    principles: [
      'Tier 1: versão mínima (regra dos 2 minutos)',
      'Tier 2: aumentar frequência ou intensidade',
      'Tier 3: hábito completo com evidência mensurável'
    ],
    streakRequired: 21,
    successThreshold: 0.85,
    targetPlaceholder: 'Ex.: ler 2 páginas (versão mínima do hábito)',
    validationPlaceholder: 'Registrei o que fiz e quando',
    extraFields: [
      {
        key: 'cue',
        label: 'Gatilho / contexto',
        placeholder: 'Ex.: após escovar os dentes à noite'
      },
      {
        key: 'reward',
        label: 'Recompensa imediata',
        placeholder: 'Ex.: marcar no app + café favorito'
      }
    ]
  },
  {
    id: 'science_66',
    label: 'Timeline realista',
    source: 'Lally et al. 2010 — UCL',
    description:
      'Em média, ~66 dias para um hábito ganhar automaticidade (varia de 18 a 254). Evolução mais lenta, mais honesta.',
    principles: [
      'Não espere mudança em 21 dias — isso é mito',
      'Consistência importa mais que perfeição',
      'Três fases de ~22 dias cada até a maestria'
    ],
    streakRequired: 66,
    successThreshold: 0.8,
    targetPlaceholder: 'Ex.: meditar 10 minutos toda manhã',
    validationPlaceholder: 'O que fiz, por quanto tempo, e como me senti depois'
  },
  {
    id: 'if_then',
    label: 'Plano se-então',
    source: 'Implementation Intentions — Gollwitzer',
    description:
      'Ligar o hábito a uma situação concreta reduz a dependência de força de vontade no momento certo.',
    principles: [
      'Formato: "Se [situação], então [ação]"',
      'Funciona bem para hábitos situacionais',
      'Validação: cumpri no contexto planejado'
    ],
    streakRequired: 28,
    successThreshold: 0.85,
    targetPlaceholder: 'Ex.: Se for 21h, então desligo o celular',
    validationPlaceholder: 'A situação aconteceu e executei a ação planejada',
    extraFields: [
      {
        key: 'situation',
        label: 'Se (situação)',
        placeholder: 'Ex.: for 21h em dia de semana'
      },
      {
        key: 'action',
        label: 'Então (ação)',
        placeholder: 'Ex.: desligo o celular e abro o livro'
      }
    ]
  },
  {
    id: 'stoic_discipline',
    label: 'Disciplina direta',
    source: 'Consistência + evidência (Forja)',
    description:
      'Foco em não quebrar a cadeia com honestidade. Evidência específica evita autoengano; recalibração sem culpa quando necessário.',
    principles: [
      'Streak visível, mas sem streak fantasma',
      'Evidência com data, número ou nome próprio',
      'Recalibrar é virtude, não fracasso'
    ],
    streakRequired: 28,
    successThreshold: 0.9,
    targetPlaceholder: 'Ex.: academia 3x por semana',
    validationPlaceholder: 'Incluir data, duração ou detalhe verificável'
  },
  {
    id: 'custom',
    label: 'Personalizado',
    source: 'Sem modelo fixo',
    description: 'Defina meta, validação e cronograma do seu jeito — como o formulário original.',
    principles: ['Você controla todos os campos'],
    streakRequired: 28,
    successThreshold: 0.9,
    targetPlaceholder: 'Ex.: Treinar 3x por semana',
    validationPlaceholder: 'Como saber que cumpriu?'
  }
];

/** @type {Record<HabitFrameworkId, HabitFramework>} */
export const HABIT_FRAMEWORK_BY_ID = Object.fromEntries(
  HABIT_FRAMEWORKS.map((f) => [f.id, f])
);

/**
 * @param {HabitFrameworkId | undefined | null} id
 * @returns {HabitFramework}
 */
export function getHabitFramework(id) {
  return HABIT_FRAMEWORK_BY_ID[id ?? 'custom'] ?? HABIT_FRAMEWORK_BY_ID.custom;
}

/**
 * Monta sugestão de meta para modelos com campos estruturados.
 * @param {HabitFramework} framework
 * @param {Record<string, string>} fields
 */
export function buildSuggestedTarget(framework, fields) {
  if (framework.id === 'if_then' && fields.situation?.trim() && fields.action?.trim()) {
    return `Se ${fields.situation.trim()}, então ${fields.action.trim()}`;
  }
  return '';
}

/**
 * Percentual mínimo de conclusões no ciclo para considerar o hábito formado.
 * @param {HabitFrameworkId | undefined | null} frameworkId
 */
export function getSuccessThreshold(frameworkId) {
  return getHabitFramework(frameworkId).successThreshold;
}

/**
 * Duração do ciclo atual em dias (do started_at até a revisão).
 * @param {HabitFrameworkId | undefined | null} frameworkId
 * @param {number} tier
 * @param {number} streakRequired
 */
export function getPeriodDays(frameworkId, tier, streakRequired) {
  if (frameworkId === 'science_66' && tier < 3) {
    return Math.max(14, Math.ceil(streakRequired / 3));
  }
  return streakRequired;
}

/**
 * @param {number} rate 0–1
 * @param {number} threshold 0–1
 */
export function formatThresholdPercent(threshold) {
  return `${Math.round(threshold * 100)}%`;
}

/**
 * @param {number} rate 0–1
 */
export function formatRatePercent(rate) {
  return `${Math.round(rate * 100)}%`;
}
