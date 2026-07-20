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
