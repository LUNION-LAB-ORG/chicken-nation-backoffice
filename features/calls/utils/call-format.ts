/** mm:ss depuis un nombre de secondes. */
export function formatCallTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Libellé lisible du statut de la room Lunion. */
export function roomStatusLabel(status: string): string {
  switch (status) {
    case "connecting":
      return "Connexion…";
    case "waiting":
      return "En attente…";
    case "connected":
      return "Connecté";
    case "error":
      return "Erreur de connexion";
    default:
      return "";
  }
}

/** Temps relatif court : "à l'instant", "il y a 5 min", "il y a 3 h", sinon date. */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = new Date(iso);
  return (
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

/** Durée d'un appel décroché : "2 min 05" ou "45 s". */
export function formatDuration(startIso: string, endIso: string): string {
  const s = Math.max(
    0,
    Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000),
  );
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m} min ${String(r).padStart(2, "0")}` : `${r} s`;
}
