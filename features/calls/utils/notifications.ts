/**
 * Notifications navigateur + flash du titre d'onglet pour les appels entrants.
 * Permet d'être alerté même quand l'onglet backoffice n'est pas au premier plan.
 *
 * Partagé avec la relance des commandes en attente (étiquette « cn-relance ») :
 * une notification par étiquette, si bien qu'une relance ne ferme jamais la
 * notification d'un appel, et inversement.
 */

const notificationsParEtiquette = new Map<string, Notification>();
const ETIQUETTE_APPEL = "cn-call";
let flashInterval: ReturnType<typeof setInterval> | null = null;
let originalTitle: string | null = null;
/** Qui fait clignoter le titre : un appel passe avant une relance, jamais l'inverse. */
let flashOwner: string | null = null;

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

/** Demande la permission (à appeler depuis un geste utilisateur). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/**
 * Affiche une notification du système sous une étiquette : elle remplace la
 * précédente de même étiquette, et seulement elle.
 */
export function showTaggedNotification(
  tag: string,
  title: string,
  body: string,
  opts?: { silent?: boolean; requireInteraction?: boolean; onClick?: () => void },
) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    closeTaggedNotification(tag);
    const notification = new Notification(title, {
      body,
      tag,
      icon: "/icons/sidebar/logo-orange.png",
      requireInteraction: opts?.requireInteraction ?? false,
      silent: opts?.silent ?? true, // notre son joue déjà
    });
    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        /* certains navigateurs bloquent focus() */
      }
      opts?.onClick?.();
      closeTaggedNotification(tag);
    };
    notificationsParEtiquette.set(tag, notification);
  } catch {
    /* constructeur Notification indisponible (ex: iOS Safari) */
  }
}

export function closeTaggedNotification(tag: string) {
  try {
    notificationsParEtiquette.get(tag)?.close();
  } catch {
    /* noop */
  }
  notificationsParEtiquette.delete(tag);
}

/** Affiche la notification d'appel (remplace la précédente, tag unique). */
export function showCallNotification(title: string, body: string, opts?: { silent?: boolean }) {
  // reste affichée tant qu'on ne clique pas
  showTaggedNotification(ETIQUETTE_APPEL, title, body, { silent: opts?.silent, requireInteraction: true });
}

export function closeCallNotification() {
  closeTaggedNotification(ETIQUETTE_APPEL);
}

/**
 * Fait clignoter le titre de l'onglet (📞 Appel entrant…). Idempotent.
 *
 * `owner` : qui le demande. Un appel (« appel », défaut) remplace le
 * clignotement d'une relance ; une relance ne remplace pas celui d'un appel.
 */
export function startTitleFlash(text: string, owner = "appel") {
  if (typeof document === "undefined") return;
  if (flashInterval) {
    if (flashOwner === owner || owner !== "appel") return;
    // Un appel arrive pendant le clignotement d'une relance : il prend la main.
    clearInterval(flashInterval);
    flashInterval = null;
  } else {
    originalTitle = document.title;
  }
  flashOwner = owner;
  let showAlt = true;
  flashInterval = setInterval(() => {
    document.title = showAlt ? text : (originalTitle ?? document.title);
    showAlt = !showAlt;
  }, 1000);
  document.title = text;
}

/** Arrête le clignotement. Avec `owner`, seulement s'il lui appartient. */
export function stopTitleFlash(owner?: string) {
  if (owner && flashOwner !== owner) return;
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
  if (originalTitle !== null && typeof document !== "undefined") {
    document.title = originalTitle;
  }
  originalTitle = null;
  flashOwner = null;
}
