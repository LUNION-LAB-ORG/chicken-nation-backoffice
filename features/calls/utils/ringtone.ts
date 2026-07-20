let audio: HTMLAudioElement | null = null;

/** Démarre la sonnerie (bouclée). Idempotent. */
export function startRingtone(src = "/musics/phone-vibration.mp3") {
  if (typeof window === "undefined" || audio) return;
  audio = new Audio(src);
  audio.loop = true;
  audio.play().catch(() => {
    // Autoplay bloqué (aucune interaction préalable) — la modale reste visible.
  });
}

/** Arrête la sonnerie. */
export function stopRingtone() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
}
