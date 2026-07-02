/** @typedef {'home'|'quests'|'cards'|'diary'|'report'} NavIconName */

/** @typedef {object} NavItem
 * @property {string} to
 * @property {string} label
 * @property {NavIconName} icon
 * @property {boolean} [end]
 * @property {boolean} [showDue]
 * @property {boolean} [showFlags]
 */

/** @type {NavItem[]} */
export const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/quests', label: 'Quests', icon: 'quests', end: false },
  { to: '/flashcards', label: 'Cards', icon: 'cards', end: false, showDue: true },
  { to: '/reflections', label: 'Diário', icon: 'diary', end: false },
  { to: '/report', label: 'Relatório', icon: 'report', end: false, showFlags: true }
];
