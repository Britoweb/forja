/** @typedef {import('./questTimeSlots.js').QuestTimeSlot} QuestTimeSlot */
/** @typedef {import('./habitFrameworks.js').HabitFrameworkId} HabitFrameworkId */

/**
 * @typedef {'stoicism'|'psychology'|'neuroscience'|'buddhism'|'habits_science'} QuestTraditionId
 */

/**
 * @typedef {object} QuestPreset
 * @property {string} id
 * @property {QuestTraditionId} tradition
 * @property {string} source
 * @property {string} title
 * @property {string} description
 * @property {'physical'|'relational'|'intellectual'|'pattern_specific'} category
 * @property {QuestTimeSlot} timeSlot
 * @property {boolean} wakeDependent
 * @property {HabitFrameworkId} framework
 * @property {string} target
 * @property {string} validation
 * @property {number} streakRequired
 */

/** @type {Record<QuestTraditionId, { label: string, description: string }>} */
export const QUEST_TRADITIONS = {
  stoicism: {
    label: 'Estoicismo',
    description: 'Exercícios diários de Marco Aurélio, Epicteto e Sêneca.'
  },
  psychology: {
    label: 'Psicologia',
    description: 'Práticas de TCC, ACT e psicologia positiva.'
  },
  neuroscience: {
    label: 'Neurociência',
    description: 'Âncoras circadianas e regulação do sistema nervoso.'
  },
  buddhism: {
    label: 'Budismo',
    description: 'Atenção plena e práticas contemplativas.'
  },
  habits_science: {
    label: 'Ciência dos hábitos',
    description: 'Estratégias de formação comportamental baseadas em evidência.'
  }
};

/** Ordem de exibição — Estoicismo primeiro. */
export const TRADITION_ORDER = [
  'stoicism',
  'psychology',
  'neuroscience',
  'buddhism',
  'habits_science'
];

/** @type {QuestPreset[]} */
export const QUEST_PRESETS = [
  // —— Estoicismo ——
  {
    id: 'stoic_morning_preparation',
    tradition: 'stoicism',
    source: 'Marco Aurélio, Meditações',
    title: 'Preparação matinal',
    description:
      'Antecipe obstáculos do dia e decida como responderá com virtude — não com reatividade.',
    category: 'intellectual',
    timeSlot: 'morning',
    wakeDependent: true,
    framework: 'stoic_discipline',
    target: 'Escrever: 1 obstáculo provável + como responderei com calma e clareza',
    validation: 'Registrei obstáculo e resposta planejada',
    streakRequired: 21
  },
  {
    id: 'stoic_dichotomy_control',
    tradition: 'stoicism',
    source: 'Epicteto, Encheirídion',
    title: 'Dicotomia do controle',
    description: 'Separe o que depende de você do que não depende — antes do dia começar.',
    category: 'intellectual',
    timeSlot: 'morning',
    wakeDependent: true,
    framework: 'if_then',
    target: 'Listar 3 coisas sob meu controle hoje e 1 que aceito não controlar',
    validation: 'Registrei as listas',
    streakRequired: 21
  },
  {
    id: 'stoic_premeditatio',
    tradition: 'stoicism',
    source: 'Sêneca, Cartas a Lucílio',
    title: 'Premeditatio malorum',
    description:
      'Visualize brevemente um contratempo possível e prepare uma resposta racional — não para sofrer antes, mas para não ser pego de surpresa.',
    category: 'intellectual',
    timeSlot: 'morning',
    wakeDependent: false,
    framework: 'tiny_habits',
    target: '2 min: imaginar 1 contratempo e minha resposta estóica',
    validation: 'Fiz a visualização e anotei a resposta',
    streakRequired: 14
  },
  {
    id: 'stoic_morning_journal',
    tradition: 'stoicism',
    source: 'Prática estóica contemporânea',
    title: 'Diário estóico',
    description: 'Três linhas: o que controlo, o que não controlo, intenção para o dia.',
    category: 'intellectual',
    timeSlot: 'morning',
    wakeDependent: true,
    framework: 'atomic_habits',
    target: 'Escrever 3 linhas: controle, fora do controle, intenção do dia',
    validation: 'Registrei as três linhas',
    streakRequired: 21
  },
  {
    id: 'stoic_virtue_pause',
    tradition: 'stoicism',
    source: 'Epicteto, Discursos',
    title: 'Pausa da virtude',
    description: 'Antes de reagir, pergunte: isto está no meu controle? Vale a pena minha energia?',
    category: 'pattern_specific',
    timeSlot: 'anytime',
    wakeDependent: false,
    framework: 'if_then',
    target: 'Se sentir irritação ou impulso, pausar 10s e perguntar: está no meu controle?',
    validation: 'Pausei e registrei o que decidi fazer',
    streakRequired: 28
  },
  {
    id: 'stoic_memento_mori',
    tradition: 'stoicism',
    source: 'Tradição estóica',
    title: 'Memento mori',
    description:
      'Um minuto de clareza sobre a finitude — não como morbidez, mas como urgência para agir com integridade.',
    category: 'intellectual',
    timeSlot: 'anytime',
    wakeDependent: false,
    framework: 'tiny_habits',
    target: '1 min de reflexão: o que faria hoje se soubesse que é finito?',
    validation: 'Fiz a reflexão e anotei 1 ação concreta',
    streakRequired: 14
  },
  {
    id: 'stoic_evening_examen',
    tradition: 'stoicism',
    source: 'Sêneca, Carta 83',
    title: 'Exame da consciência',
    description:
      'Três perguntas de Sêneca: que mal curei? que paixão resisti? que dever negligenciei?',
    category: 'intellectual',
    timeSlot: 'evening',
    wakeDependent: false,
    framework: 'stoic_discipline',
    target: 'Responder por escrito às 3 perguntas do exame sênecano',
    validation: 'Registrei as três respostas',
    streakRequired: 28
  },
  {
    id: 'stoic_view_from_above',
    tradition: 'stoicism',
    source: 'Marco Aurélio, Meditações VII',
    title: 'Vista de cima',
    description: 'Perspectiva cósmica: seu problema é pequeno no todo — reduz dramatização.',
    category: 'intellectual',
    timeSlot: 'evening',
    wakeDependent: false,
    framework: 'science_66',
    target: '2 min: imaginar o dia visto de cima, como parte do todo',
    validation: 'Fiz a visualização e anotei o que mudou na perspectiva',
    streakRequired: 22
  },

  // —— Psicologia ——
  {
    id: 'psych_gratitude_three',
    tradition: 'psychology',
    source: 'Psicologia positiva',
    title: 'Três gratidões',
    description: 'Registrar três coisas específicas pelas quais é grato hoje — com detalhe, não genérico.',
    category: 'intellectual',
    timeSlot: 'evening',
    wakeDependent: false,
    framework: 'atomic_habits',
    target: 'Escrever 3 gratidões específicas com nome ou detalhe',
    validation: 'Registrei as três com especificidade',
    streakRequired: 21
  },
  {
    id: 'psych_defusion_pause',
    tradition: 'psychology',
    source: 'ACT — Terapia de Aceitação e Compromisso',
    title: 'Pausa de defusão',
    description: 'Observar um pensamento difícil como evento mental, não como verdade absoluta.',
    category: 'pattern_specific',
    timeSlot: 'anytime',
    wakeDependent: false,
    framework: 'if_then',
    target: 'Se surgir autocrítica, nomear: "estou tendo o pensamento de que…"',
    validation: 'Nomeei o pensamento e registrei',
    streakRequired: 28
  },
  {
    id: 'psych_self_compassion',
    tradition: 'psychology',
    source: 'Kristin Neff — autocompaixão',
    title: 'Pausa de autocompaixão',
    description: 'Tratar-se com a mesma gentileza que teria com um amigo em dificuldade.',
    category: 'pattern_specific',
    timeSlot: 'anytime',
    wakeDependent: false,
    framework: 'tiny_habits',
    target: '2 min: reconhecer a dor, lembrar que é humano, dizer algo gentil a mim',
    validation: 'Fiz a pausa e registrei a frase gentil',
    streakRequired: 21
  },

  // —— Neurociência ——
  {
    id: 'neuro_morning_light',
    tradition: 'neuroscience',
    source: 'Ritmo circadiano',
    title: 'Luz natural ao acordar',
    description: '5–10 min de luz natural ou ar livre logo ao levantar — ancora o relógio biológico.',
    category: 'physical',
    timeSlot: 'morning',
    wakeDependent: true,
    framework: 'tiny_habits',
    target: '5 min de luz natural ou ar livre ao acordar',
    validation: 'Fiz ao acordar',
    streakRequired: 14
  },
  {
    id: 'neuro_evening_winddown',
    tradition: 'neuroscience',
    source: 'Higiene do sono',
    title: 'Desaceleração noturna',
    description: '30 min antes de dormir sem telas — sinal de fechamento do dia para o cérebro.',
    category: 'physical',
    timeSlot: 'evening',
    wakeDependent: false,
    framework: 'if_then',
    target: 'Se for 30 min antes de dormir, então desligo telas e faço algo calmo',
    validation: 'Cumpri o ritual de desaceleração',
    streakRequired: 28
  },

  // —— Budismo ——
  {
    id: 'buddhist_breath_morning',
    tradition: 'buddhism',
    source: 'Satipatthana — atenção plena',
    title: 'Meditação da respiração',
    description: '5 min observando a respiração — âncora de presença antes do dia.',
    category: 'intellectual',
    timeSlot: 'morning',
    wakeDependent: true,
    framework: 'tiny_habits',
    target: '5 min de respiração consciente',
    validation: 'Meditei e registrei como foi',
    streakRequired: 21
  },
  {
    id: 'buddhist_metta_evening',
    tradition: 'buddhism',
    source: 'Metta — bondade amorosa',
    title: 'Metta noturna',
    description: 'Desejar bem a si e a alguém importante — 2 minutos de intenção genuína.',
    category: 'relational',
    timeSlot: 'evening',
    wakeDependent: false,
    framework: 'atomic_habits',
    target: '2 min de metta: por mim e por uma pessoa que escolhi',
    validation: 'Fiz a prática e nomeei a pessoa',
    streakRequired: 21
  },

  // —— Ciência dos hábitos ——
  {
    id: 'habits_two_minute',
    tradition: 'habits_science',
    source: 'James Clear — Atomic Habits',
    title: 'Regra dos 2 minutos',
    description: 'Versão mínima de um hábito desejado — começar ridiculamente pequeno.',
    category: 'physical',
    timeSlot: 'anytime',
    wakeDependent: false,
    framework: 'tiny_habits',
    target: 'Fazer a versão de 2 min do hábito que quero construir',
    validation: 'Fiz o mínimo e celebrei',
    streakRequired: 14
  },
  {
    id: 'habits_evening_review',
    tradition: 'habits_science',
    source: 'Revisão comportamental',
    title: 'Revisão do dia',
    description: 'O que funcionou? O que ajustar amanhã? — sem julgamento, só dados.',
    category: 'intellectual',
    timeSlot: 'evening',
    wakeDependent: false,
    framework: 'stoic_discipline',
    target: 'Responder: 1 vitória, 1 obstáculo, 1 ajuste para amanhã',
    validation: 'Registrei as três respostas',
    streakRequired: 28
  }
];

/** @type {Record<string, QuestPreset>} */
export const QUEST_PRESET_BY_ID = Object.fromEntries(QUEST_PRESETS.map((p) => [p.id, p]));

/**
 * @param {QuestPreset} preset
 */
export function presetToQuestInput(preset) {
  return {
    title: preset.title,
    category: preset.category,
    questType: 'daily',
    patternId: null,
    target: preset.target,
    validation: preset.validation,
    streakRequired: preset.streakRequired,
    framework: preset.framework,
    frameworkFields: {},
    timeSlot: preset.timeSlot,
    wakeDependent: preset.wakeDependent,
    presetId: preset.id,
    tradition: preset.tradition,
    source: preset.source
  };
}

/**
 * @param {object[]} activeItems
 * @param {string[]} declinedIds
 * @returns {QuestPreset[]}
 */
export function getAvailablePresets(activeItems, declinedIds = []) {
  const activeKeys = new Set(
    activeItems.flatMap((item) => {
      const title = item.quest.title.trim().toLowerCase();
      const presetId = item.version?.definition?.presetId;
      return presetId ? [title, presetId] : [title];
    })
  );
  const declined = new Set(declinedIds);

  return QUEST_PRESETS.filter(
    (preset) => !activeKeys.has(preset.title.trim().toLowerCase()) && !activeKeys.has(preset.id) && !declined.has(preset.id)
  );
}

/**
 * @param {QuestPreset[]} presets
 * @returns {Record<QuestTraditionId, QuestPreset[]>}
 */
export function groupPresetsByTradition(presets) {
  /** @type {Record<string, QuestPreset[]>} */
  const groups = {};

  for (const id of TRADITION_ORDER) {
    groups[id] = [];
  }

  for (const preset of presets) {
    if (!groups[preset.tradition]) groups[preset.tradition] = [];
    groups[preset.tradition].push(preset);
  }

  return groups;
}

/**
 * @param {QuestPreset} preset
 */
export function getTraditionLabel(preset) {
  return QUEST_TRADITIONS[preset.tradition]?.label ?? preset.tradition;
}
