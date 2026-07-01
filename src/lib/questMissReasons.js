import { getTimeSlotLabel } from './questTimeSlots.js';

/**
 * @typedef {object} MissReasonOption
 * @property {string} code
 * @property {string} label
 */

/**
 * @typedef {object} MissReasonSet
 * @property {string} question
 * @property {MissReasonOption[]} options
 */

/** @type {Record<string, MissReasonSet>} */
export const MISS_REASON_SETS = {
  morning_wake: {
    question: 'Por que não fez esta quest da manhã?',
    options: [
      { code: 'overslept', label: 'Não acordei no horário' },
      { code: 'forgot', label: 'Esqueci / passou batido' },
      { code: 'no_energy', label: 'Sem energia ou priorizei outro' },
      { code: 'skipped_choice', label: 'Decidi não fazer hoje' }
    ]
  },
  morning: {
    question: 'Por que não fez esta quest da manhã?',
    options: [
      { code: 'no_time', label: 'Não tive tempo' },
      { code: 'forgot', label: 'Esqueci / passou batido' },
      { code: 'no_energy', label: 'Sem energia ou priorizei outro' },
      { code: 'skipped_choice', label: 'Decidi não fazer hoje' }
    ]
  },
  evening: {
    question: 'Por que não fez esta quest da noite?',
    options: [
      { code: 'too_tired', label: 'Cansaço / sono antes' },
      { code: 'forgot', label: 'Esqueci / passou batido' },
      { code: 'no_time', label: 'Dia tomou conta' },
      { code: 'skipped_choice', label: 'Decidi não fazer hoje' }
    ]
  },
  generic: {
    question: 'O que aconteceu hoje?',
    options: [
      { code: 'no_time', label: 'Não tive tempo' },
      { code: 'forgot', label: 'Esqueci' },
      { code: 'blocked', label: 'Evitei ou bloqueio emocional' },
      { code: 'skipped_choice', label: 'Decidi não fazer hoje' }
    ]
  }
};

/**
 * @param {object} quest
 * @param {object} version
 * @returns {MissReasonSet}
 */
export function getMissReasonSet(quest, version) {
  const timeSlot = version.definition?.timeSlot ?? 'anytime';
  const wakeDependent = version.definition?.wakeDependent ?? false;

  if (timeSlot === 'morning' && wakeDependent) {
    return MISS_REASON_SETS.morning_wake;
  }
  if (timeSlot === 'morning') {
    return MISS_REASON_SETS.morning;
  }
  if (timeSlot === 'evening') {
    return MISS_REASON_SETS.evening;
  }

  const slotLabel = getTimeSlotLabel(timeSlot);
  if (timeSlot !== 'anytime') {
    return {
      question: `Por que não fez esta quest (${slotLabel.toLowerCase()})?`,
      options: MISS_REASON_SETS.generic.options
    };
  }

  return {
    question: `Por que não fez "${quest.title}" hoje?`,
    options: MISS_REASON_SETS.generic.options
  };
}
