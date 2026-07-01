/** @typedef {'morning'|'evening'} ReflectionType */

export const REFLECTION_TYPE_LABELS = {
  morning: 'Manhã',
  evening: 'Noite'
};

/** @type {Record<ReflectionType, { title: string, intro: string, fields: { key: string, label: string, placeholder: string }[] }>} */
export const REFLECTION_PROMPTS = {
  morning: {
    title: 'Reflexão da manhã',
    intro: 'Três linhas estóicas: controle, fora do controle, intenção do dia.',
    fields: [
      {
        key: 'control',
        label: 'O que controlo hoje',
        placeholder: 'Minhas escolhas, esforço, atenção…'
      },
      {
        key: 'outside_control',
        label: 'O que não controlo',
        placeholder: 'Clima, opiniões alheias, o passado…'
      },
      {
        key: 'intention',
        label: 'Intenção do dia',
        placeholder: 'Como quero responder aos obstáculos?'
      }
    ]
  },
  evening: {
    title: 'Exame da noite',
    intro: 'Exame sênecano: o que curei, o que resisti, o que negligenciei.',
    fields: [
      {
        key: 'cured',
        label: 'Que mal ou hábito enfrentei hoje?',
        placeholder: 'Ex.: reatividade, procrastinação…'
      },
      {
        key: 'resisted',
        label: 'Que impulso ou paixão resisti?',
        placeholder: 'Ex.: auto-flagelação, evitação…'
      },
      {
        key: 'neglected',
        label: 'Que dever ou valor negligenciei?',
        placeholder: 'Ex.: presença com filhos, sono, quest…'
      },
      {
        key: 'free',
        label: 'Livre (opcional)',
        placeholder: 'O que mais importa registrar sobre o dia?'
      }
    ]
  }
};
