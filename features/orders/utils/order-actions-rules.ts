import { OrderStatus } from "../types/order.types";
import { UserRole } from "../../users/types/user.types";
import { peutModifierCommande } from "./modification-commande";

/**
 * RÈGLES UNIQUES DES ACTIONS SUR UNE COMMANDE.
 *
 * Le menu de ligne de la liste (OrderContextMenu) et le menu ⋮ du tiroir
 * (DrawerActionsMenu) lisent tous deux `actionsCommande()`. Aucun des deux ne
 * recalcule un droit de son côté : une règle changée ici change aux deux
 * endroits, elles ne peuvent pas diverger.
 */

export type ActionCommande =
  | "accepter"
  | "refuser"
  | "imprimer"
  | "voir"
  | "modifier"
  | "annuler"
  | "supprimer";

/** Droits de l'utilisateur connecté, lus par `useDroitsCommande()`. */
export interface DroitsCommande {
  role: UserRole | undefined;
  /** COMMANDES READ */
  peutLire: boolean;
  /** COMMANDES UPDATE */
  peutChangerStatut: boolean;
  /** COMMANDES UPDATE_FULL */
  peutModifier: boolean;
  /** COMMANDES DELETE */
  peutSupprimer: boolean;
}

/**
 * Statuts où le pied du tiroir propose déjà « Annuler la commande »
 * (DrawerCancelAction), pour tous les rôles. Le composant du pied lit cette
 * même constante.
 */
export const STATUTS_ANNULABLES_EN_BAS_DU_TIROIR: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.ACCEPTED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.READY,
]);

/**
 * Le STATUT permet-il à ce rôle de modifier la commande ?
 *
 * Délègue à `peutModifierCommande()` (./modification-commande.ts), jumeau
 * exact de la garde du serveur : ADMIN partout ; tout rôle sur une commande
 * en attente, acceptée, en préparation ou prête ; CALL_CENTER en plus sur une
 * commande annulée (qui reste annulée). Jamais en livraison (PICKED_UP) hors
 * ADMIN : le serveur refuserait l'enregistrement.
 */
export const statutPermetModification = (
  status: OrderStatus | undefined,
  role: UserRole | undefined,
): boolean => peutModifierCommande(role, status);

/**
 * Actions proposées, dans l'ordre d'affichage.
 *
 * `ou` :
 *  - "liste"  : menu de ligne de la liste, comportement historique inchangé.
 *  - "tiroir" : menu ⋮ du tiroir. MÊMES règles de droits ; on retire
 *    seulement ce que le tiroir affiche déjà ailleurs :
 *      · « Voir les détails » : on est dans les détails ;
 *      · « Imprimer » : bouton de l'en-tête ;
 *      · « Accepter » / « Refuser » d'une NOUVELLE (ACCEPTED) : le pied
 *        propose déjà « Commencer la préparation » et « Annuler la commande » ;
 *      · « Annuler la commande » quand le pied la propose déjà
 *        (STATUTS_ANNULABLES_EN_BAS_DU_TIROIR).
 */
export const actionsCommande = (
  status: OrderStatus | undefined,
  droits: DroitsCommande,
  ou: "liste" | "tiroir" = "liste",
): ActionCommande[] => {
  const isAdmin = droits.role === UserRole.ADMIN;
  // « NOUVELLE » à l'écran = ACCEPTED côté serveur (libellé historique).
  const estNouvelle = status === OrderStatus.ACCEPTED;
  const actions: ActionCommande[] = [];

  if (estNouvelle) {
    if (droits.peutChangerStatut) actions.push("accepter", "refuser");
    if (droits.peutLire) actions.push("voir");
  } else {
    actions.push("imprimer");
    if (droits.peutLire) actions.push("voir");
  }

  // Modifier : l'ADMIN sans condition de permission ; les autres rôles avec
  // COMMANDES UPDATE_FULL, sur un statut que leur rôle peut modifier.
  if (statutPermetModification(status, droits.role) && (isAdmin || droits.peutModifier)) {
    actions.push("modifier");
  }

  // Annuler la commande : ADMIN, quel que soit le statut, sauf déjà annulée.
  // Pas sur une NOUVELLE : « Refuser » couvre ce cas.
  if (isAdmin && !estNouvelle && status !== OrderStatus.CANCELLED) {
    actions.push("annuler");
  }

  if (droits.peutSupprimer) actions.push("supprimer");

  if (ou === "liste") return actions;

  return actions.filter((action) => {
    if (action === "voir" || action === "imprimer") return false;
    if (action === "accepter" || action === "refuser") return false;
    if (action === "annuler" && status && STATUTS_ANNULABLES_EN_BAS_DU_TIROIR.has(status)) {
      return false;
    }
    return true;
  });
};
