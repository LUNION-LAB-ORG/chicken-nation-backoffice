/** Erreur d'un appel du planning : le texte du serveur et son statut HTTP. */
export type ErreurPlanning = Error & { status?: number };

/**
 * Vrai si la route n'existe pas sur ce serveur (serveur pas encore à jour) :
 * 404 de NestJS « Cannot GET /… », pas le 404 d'un planning effacé
 * (« Ce planning n'existe plus. »).
 */
export const estRouteAbsente = (error: unknown): boolean => {
  const e = error as ErreurPlanning | null;
  if (e?.status !== 404) return false;
  const texte = e.message ?? "";
  // Sans corps JSON (proxy), `api` lève son texte par défaut.
  return /^Cannot [A-Z]+ \//.test(texte) || texte === "Ressource non trouvée.";
};

/**
 * Le planning lui-même n'existe plus (relecture du 25/10) : supprimé, ou
 * refait ailleurs sous un nouvel identifiant par « Modifier les dates ».
 */
export const estPlanningEfface = (error: unknown): boolean =>
  (error as ErreurPlanning | null)?.status === 404 && !estRouteAbsente(error);

/** Détail et compteurs relus toutes les 15 s, sauf pour un planning qui n'existe plus. */
export const relectureDuDetail = (error: unknown): number | false =>
  estPlanningEfface(error) ? false : 15 * 1000;
