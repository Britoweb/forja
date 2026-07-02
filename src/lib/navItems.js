/** @typedef {object} NavItem
 * @property {string} to
 * @property {string} label
 * @property {boolean} [end]
 * @property {boolean} [showDue]
 * @property {boolean} [showFlags]
 */

/** @type {NavItem[]} */
export const NAV_ITEMS = [
  { to: '/', label: 'Início', end: true },
  { to: '/quests', label: 'Quests', end: false },
  { to: '/flashcards', label: 'Cards', end: false, showDue: true },
  { to: '/reflections', label: 'Diário', end: false },
  { to: '/report', label: 'Relatório', end: false, showFlags: true }
];
