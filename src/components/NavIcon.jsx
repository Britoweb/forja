/** @typedef {'home'|'quests'|'cards'|'diary'|'report'} NavIconName */

const SVG_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true
};

/** @type {Record<NavIconName, JSX.Element>} */
const ICONS = {
  home: (
    <svg {...SVG_PROPS}>
      <path d="M4 10.2 12 4l8 6.2V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9V20.5H5.5A1.5 1.5 0 0 1 4 19v-8.8z" />
    </svg>
  ),
  quests: (
    <svg {...SVG_PROPS}>
      <path d="M9 11 11 13 15 9" />
      <path d="M5 5.5h14v13H5z" />
      <path d="M8 3.5h8" />
    </svg>
  ),
  cards: (
    <svg {...SVG_PROPS}>
      <rect x="5" y="7" width="12" height="14" rx="1.5" />
      <path d="M8 4.5h11a1.5 1.5 0 0 1 1.5 1.5V17" />
    </svg>
  ),
  diary: (
    <svg {...SVG_PROPS}>
      <path d="M6 4.5h9l4.5 4.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V6A1.5 1.5 0 0 1 6 4.5z" />
      <path d="M15 4.5V9h4.5" />
      <path d="M8 12.5h8M8 15.5h6" />
    </svg>
  ),
  report: (
    <svg {...SVG_PROPS}>
      <path d="M6 19.5V9.5M12 19.5V4.5M18 19.5v-7" />
      <path d="M4.5 19.5h15" />
    </svg>
  )
};

/**
 * @param {{ name: NavIconName, className?: string }} props
 */
export default function NavIcon({ name, className = 'bottom-nav-svg' }) {
  return <span className={className}>{ICONS[name]}</span>;
}
