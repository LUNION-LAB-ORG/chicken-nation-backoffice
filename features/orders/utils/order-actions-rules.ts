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
  | "supprimer"
  | "terminer"
  | "affecter"
  | "retirer";

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

/** Ce que les gestes du siège regardent en plus du statut (menu ⋮ du tiroir). */
export interface ContexteGestes {
  /** Commande à livrer. */
  aLivrer?: boolean;
  /** Payée : « Récupérée » suffit alors à la terminer. */
  payee?: boolean;
  /** Dans une course encore en cours. */
  surUneCourse?: boolean;
  /** `piloterCourses` : miroir de `ROLES_ACTIONS_COURSES` du serveur. */
  piloterCourses?: boolean;
}

/**
 * « Terminer », « Affecter à un livreur » et « Retirer de la course » (demande
 * du 06/11). Miroir des refus du serveur : `terminerParAdmin`,
 * `refusCommandeAAffecter` et `deciderDetachement`.
 */
const gestesDuSiege = (
  status: OrderStatus | undefined,
  isAdmin: boolean,
  c: ContexteGestes,
): ActionCommande[] => {
  const gestes: ActionCommande[] = [];
  const auRestaurant = !!status && STATUTS_ANNULABLES_EN_BAS_DU_TIROIR.has(status);
  const enLivraison = status === OrderStatus.PICKED_UP;
  if (isAdmin && (auRestaurant || enLivraison || (status === OrderStatus.COLLECTED && c.payee))) {
    gestes.push("terminer");
  }
  if (c.piloterCourses && c.aLivrer) {
    if (status === OrderStatus.READY) gestes.push("affecter");
    if (auRestaurant && c.surUneCourse) gestes.push("retirer");
  }
  return gestes;
};

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
 *
 * `contexte.dejaSupprimee` : la commande est déjà retirée des listes
 * (`entity_status` DELETED). Seul cas qu'un écran puisse ouvrir : le panier
 * annulé par le client, rendu par GET /orders/:id aux rôles ADMIN et
 * CALL_CENTER depuis « À relancer ». « Supprimer » n'y est pas proposé :
 * DELETE /orders/:id ne trouve plus une commande supprimée et répondrait 404.
 */
export const actionsCommande = (
  status: OrderStatus | undefined,
  droits: DroitsCommande,
  ou: "liste" | "tiroir" = "liste",
  contexte: { dejaSupprimee?: boolean } & ContexteGestes = {},
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

  if (droits.peutSupprimer && !contexte.dejaSupprimee) actions.push("supprimer");

  if (ou === "liste") return actions;

  const tiroir = actions.filter((action) => {
    if (action === "voir" || action === "imprimer") return false;
    if (action === "accepter" || action === "refuser") return false;
    if (action === "annuler" && status && STATUTS_ANNULABLES_EN_BAS_DU_TIROIR.has(status)) {
      return false;
    }
    return true;
  });
  // Après « Modifier », avant ce qui détruit (« Annuler », « Supprimer »).
  const apresModifier = tiroir[0] === "modifier" ? 1 : 0;
  tiroir.splice(apresModifier, 0, ...gestesDuSiege(status, isAdmin, contexte));
  return tiroir;
};
