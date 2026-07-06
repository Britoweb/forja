import { resolveDeckForQuest } from './flashcardDecks.js';
import { QUEST_PRESET_BY_ID } from './questPresets.js';

/**
 * @typedef {object} QuestFlashcardContent
 * @property {string} front
 * @property {string} back
 */

/** @type {Record<string, QuestFlashcardContent>} */
export const PRESET_FLASHCARDS = {
  stoic_morning_preparation: {
    front: 'Um obstáculo surgiu hoje. Como respondo?',
    back: 'Antecipei e escolho virtude sobre reatividade. Só controlo minha resposta.'
  },
  stoic_dichotomy_control: {
    front: 'Isto está sob meu controle?',
    back: 'Controlo escolhas, julgamentos e ações. O resto, aceito sem desperdiçar energia.'
  },
  stoic_premeditatio: {
    front: 'Um contratempo aconteceu — fui pego de surpresa?',
    back: 'Já visualizei e tenho resposta racional. Imprevistos não me definem.'
  },
  stoic_morning_journal: {
    front: 'Diário estóico: o que controlo hoje?',
    back: 'Controlo / não controlo / intenção. Três linhas, clareza antes da ação.'
  },
  stoic_virtue_pause: {
    front: 'Sinto irritação ou impulso.',
    back: 'Pauso 10s. Está no meu controle? Vale minha energia? Depois ajo.'
  },
  stoic_memento_mori: {
    front: 'Estou adiando o que importa?',
    back: 'O tempo é finito. Urgência honesta — não drama — para agir com integridade.'
  },
  stoic_evening_examen: {
    front: 'Exame da consciência — quais são as 3 perguntas da noite?',
    back: `1. Que hábito ruim você curou hoje?
(Qual vício você realmente trabalhou e conseguiu frear)

2. Que vício você conteve?
(Quais impulsos ou fraquezas você reconheceu e não cedeu)

3. Em que aspecto você melhorou?
(Onde você foi melhor que ontem, por menor que seja)`
  },
  stoic_view_from_above: {
    front: 'Estou dramatizando este problema?',
    back: 'Vista de cima: sou parte do todo. O problema é menor do que parece no calor do momento.'
  },
  psych_gratitude_three: {
    front: 'O que de específico merece gratidão hoje?',
    back: 'Três gratidões com nome ou detalhe — não genérico. Treina o olhar.'
  },
  psych_defusion_pause: {
    front: 'Um pensamento autocrítico apareceu.',
    back: 'Estou tendo o pensamento de que… — não é verdade absoluta, é evento mental.'
  },
  psych_self_compassion: {
    front: 'Estou sendo cruel comigo mesmo.',
    back: 'Trataria um amigo assim? Reconheço a dor, lembro que é humano, digo algo gentil.'
  },
  buddhist_breath_morning: {
    front: 'A mente está dispersa.',
    back: 'Volto à respiração. Cinco minutos de presença antes de reagir ao dia.'
  },
  buddhist_metta_evening: {
    front: 'Fechando o dia com dureza.',
    back: 'Metta: desejo bem a mim e a quem escolhi. Dois minutos de intenção genuína.'
  },
  habits_evening_review: {
    front: 'O que o dia me ensinou?',
    back: '1 vitória, 1 obstáculo, 1 ajuste para amanhã — dados, não julgamento.'
  }
};

/**
 * @param {object} quest
 * @param {object} version
 */
export function buildFlashcardFromQuest(quest, version) {
  const presetId = version.definition?.presetId;
  const preset = presetId ? QUEST_PRESET_BY_ID[presetId] : null;
  const presetCard = presetId ? PRESET_FLASHCARDS[presetId] : null;

  const front = presetCard?.front ?? `Pratico: ${quest.title}`;
  const back =
    presetCard?.back ??
    `${version.definition?.target ?? ''}\n\nValidação: ${version.definition?.validation ?? 'Cumpri com evidência.'}`;

  return {
    front: front.trim(),
    back: back.trim(),
    patternId: quest.pattern_id || null,
    deck: resolveDeckForQuest(quest, version),
    questId: quest.id,
    presetId: presetId ?? null,
    source: 'quest_generated',
    sourceLabel: preset?.source ?? version.definition?.source ?? null
  };
}

/**
 * @param {object[]} cards
 * @param {string} questId
 * @param {{ presetId?: string | null, front?: string }} [match]
 */
export function hasCardForQuest(cards, questId, match = {}) {
  const normFront = match.front?.trim().toLowerCase();

  return cards.some((c) => {
    if (c.quest_id && c.quest_id === questId) return true;
    if (match.presetId && c.preset_id === match.presetId) return true;
    if (normFront && c.front?.trim().toLowerCase() === normFront) return true;
    return false;
  });
}

/**
 * @param {object} quest
 * @param {object} version
 * @param {object[]} cards
 */
export function hasCardForQuestItem(cards, quest, version) {
  const suggestion = buildFlashcardFromQuest(quest, version);
  return hasCardForQuest(cards, quest.id, {
    presetId: suggestion.presetId,
    front: suggestion.front
  });
}

/**
 * @param {object[]} questItems
 * @param {object[]} cards
 */
export function getQuestFlashcardSuggestions(questItems, cards) {
  return questItems
    .filter(
      (item) => item.version && !hasCardForQuestItem(cards, item.quest, item.version)
    )
    .map((item) => ({
      quest: item.quest,
      version: item.version,
      suggestion: buildFlashcardFromQuest(item.quest, item.version)
    }));
}
