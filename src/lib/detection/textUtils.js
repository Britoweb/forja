const NEGATIVE_MARKERS = [
  'não consegui',
  'nao consegui',
  'falhei',
  'reagi mal',
  'de novo',
  'outra vez',
  'sou fraco',
  'menino',
  'não aguento',
  'nao aguento',
  'desisti'
];

const DATE_OR_NUMBER = /\b(\d{1,2}[\/\-.]\d{1,2}|\d+%?|\d+\s*(min|horas?|h|kg|km))\b/i;
const PROPER_NAME = /\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]{2,}\b/;

/**
 * @param {string} text
 */
export function wordCount(text) {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * @param {string} text
 */
export function hasSpecificity(text) {
  if (!text) return false;
  return DATE_OR_NUMBER.test(text) || PROPER_NAME.test(text);
}

/**
 * @param {string} text
 */
export function hasNegativeMarkers(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return NEGATIVE_MARKERS.some((m) => lower.includes(m));
}

/**
 * @param {object} content
 */
export function reflectionPlainText(content) {
  if (!content) return '';
  if (typeof content.text === 'string' && content.text.trim()) return content.text.trim();
  const answers = content.answers ?? {};
  return Object.values(answers)
    .filter((v) => typeof v === 'string' && v.trim())
    .join('\n');
}

/**
 * @param {Date} date
 */
export function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * @param {number[]} values
 */
export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * @param {number[]} values
 */
export function stdDev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
