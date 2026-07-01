const NOTIFIED_KEY = 'forja_flashcards_notified_session';

/**
 * @returns {boolean}
 */
export function notificationsSupported() {
  return typeof Notification !== 'undefined';
}

/**
 * @returns {NotificationPermission | 'unsupported'}
 */
export function getNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * @returns {Promise<NotificationPermission | 'unsupported'>}
 */
export async function requestFlashcardNotifications() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

/**
 * @param {number} dueCount
 */
export function notifyDueFlashcards(dueCount) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  if (dueCount <= 0) return;
  if (sessionStorage.getItem(NOTIFIED_KEY) === '1') return;

  const body =
    dueCount === 1
      ? 'Você tem 1 card para revisar no Forja.'
      : `Você tem ${dueCount} cards para revisar no Forja.`;

  try {
    new Notification('Forja — revisão', {
      body,
      tag: 'forja-flashcards-due',
      renotify: false
    });
    sessionStorage.setItem(NOTIFIED_KEY, '1');
  } catch {
    // Alguns browsers bloqueiam fora de gesto do usuário
  }
}

export function clearFlashcardNotificationSession() {
  sessionStorage.removeItem(NOTIFIED_KEY);
}
