/**
 * PIED DU TIROIR D'UNE COMMANDE (écran Opérations).
 *
 * Un rôle qui peut changer le statut voit les boutons (`ACTIONS`). Un rôle de
 * consultation, comme le suivi des livraisons (`LIVRAISON_OPS`), voit quand
 * même le suivi d'une course interne (`SUIVI`) : le livreur et son état, la
 * retenue au comptoir, l'ajout à la course et le code de retrait (relecture du
 * 24/10 : il devait revenir à la liste pour le lire, alors que c'est
 * précisément son travail). Ce n'est que de l'information, déjà montrée sur
 * la liste : aucun bouton, aucune annulation.
 *
 * Fichier pur : testé par `bun test`.
 */

export type PiedDuTiroir = 'ACTIONS' | 'SUIVI' | null;

/** Statuts où le tiroir d'une livraison interne montre le suivi de la course. */
const STATUTS_SUIVI = new Set(['READY', 'PICKED_UP']);

export function piedDuTiroir(
  commande: { type?: string | null; delivery_service?: string | null; status?: string | null } | null | undefined,
  peutChangerStatut: boolean,
): PiedDuTiroir {
  if (!commande) return null;
  if (peutChangerStatut) return 'ACTIONS';
  if (commande.type !== 'DELIVERY' || commande.delivery_service !== 'CHICKEN_NATION') return null;
  return STATUTS_SUIVI.has(commande.status ?? '') ? 'SUIVI' : null;
}
