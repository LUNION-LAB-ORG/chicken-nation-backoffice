/** Fabrique un contrôleur de sonnerie bouclée (start idempotent + stop). */
function makeRing(src: string) {
  let audio: HTMLAudioElement | null = null;
  return {
    start() {
      if (typeof window === "undefined" || audio) return;
      audio = new Audio(src);
      audio.loop = true;
      audio.play().catch(() => {
        // Autoplay bloqué (aucune interaction préalable) — l'UI reste visible.
      });
    },
    stop() {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
      }
    },
  };
}

/** Sonnerie d'appel ENTRANT (récepteur) — sonnerie iPhone. */
export const incomingRing = makeRing("/musics/call-incoming.mp3");

/** Tonalité de RETOUR D'APPEL (appelant) — jouée pendant l'attente du décrochage. */
export const ringbackTone = makeRing("/musics/call-ringback.mp3");
