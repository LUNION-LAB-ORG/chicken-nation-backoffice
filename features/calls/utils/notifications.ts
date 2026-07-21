/**
 * Notifications navigateur + flash du titre d'onglet pour les appels entrants.
 * Permet d'être alerté même quand l'onglet backoffice n'est pas au premier plan.
 */

let currentNotification: Notification | null = null;
let flashInterval: ReturnType<typeof setInterval> | null = null;
let originalTitle: string | null = null;

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

/** Affiche la notification d'appel (remplace la précédente, tag unique). */
export function showCallNotification(title: string, body: string, opts?: { silent?: boolean }) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    closeCallNotification();
    currentNotification = new Notification(title, {
      body,
      tag: "cn-call",
      icon: "/icons/sidebar/logo-orange.png",
      requireInteraction: true, // reste affichée tant qu'on ne clique pas
      silent: opts?.silent ?? true, // notre sonnerie joue déjà
    });
    currentNotification.onclick = () => {
      try {
        window.focus();
      } catch {
        /* certains navigateurs bloquent focus() */
      }
      closeCallNotification();
    };
  } catch {
    /* constructeur Notification indisponible (ex: iOS Safari) */
  }
}

export function closeCallNotification() {
  try {
    currentNotification?.close();
  } catch {
    /* noop */
  }
  currentNotification = null;
}

/** Fait clignoter le titre de l'onglet (📞 Appel entrant…). Idempotent. */
export function startTitleFlash(text: string) {
  if (typeof document === "undefined" || flashInterval) return;
  originalTitle = document.title;
  let showAlt = true;
  flashInterval = setInterval(() => {
    document.title = showAlt ? text : (originalTitle ?? document.title);
    showAlt = !showAlt;
  }, 1000);
  document.title = text;
}

export function stopTitleFlash() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
  if (originalTitle !== null && typeof document !== "undefined") {
    document.title = originalTitle;
  }
  originalTitle = null;
}
