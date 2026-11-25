import type { BrouillonLigne, GroupeRelance } from "../types/relance.types";

/**
 * Boutons d'une relance, dans l'ordre de l'écran. Logique pure, testée seule
 * (`__tests__/relance-a-confirmer.test.ts`, `__tests__/relance-paiement.test.ts`) :
 * la ligne ne fait que les rendre.
 *
 *  - `prendre` : « Je m'en occupe », sur un groupe à relancer ;
 *  - `reprendre` : « Reprendre au téléphone », sur la prise de l'agent ;
 *  - `confirmer_paiement` : « Confirmer le paiement », quand un panier du
 *    groupe attend un paiement en ligne, et seulement si l'agent l'a en
 *    main (le client lui dit au téléphone qu'il a payé), ou si le webhook a
 *    signalé un paiement réussi sans confirmer la commande (sauf pendant la
 *    prise d'un collègue, l'ADMIN passe). Quel que soit l'état, paiement en
 *    cours compris. Pas sur toutes les cartes : sans signal, seul le client
 *    sait s'il a été débité ;
 *  - `liberer` : sa propre prise, ou celle d'un collègue pour l'ADMIN ;
 *  - `ignorer` : sauf la prise d'un collègue (l'ADMIN passe), et JAMAIS sur
 *    une commande à confirmer : elle resterait en attente pour toujours, le
 *    client verrait « À confirmer » sans fin (le serveur répond 409) ;
 *  - `annuler` : « Annuler la commande », à sa place, réservé à la commande
 *    à confirmer, avec la même garde sur la prise d'un collègue ;
 *  - `ouvrir` : toujours.
 */
export type ActionRelance =
  | "prendre"
  | "reprendre"
  | "confirmer_paiement"
  | "liberer"
  | "ignorer"
  | "annuler"
  | "ouvrir";

export function actionsRelance(
  groupe: Pick<GroupeRelance, "etat" | "prise" | "a_confirmer"> &
    Partial<Pick<GroupeRelance, "tete" | "autres" | "signaux">>,
  { estAdmin }: { estAdmin: boolean },
): ActionRelance[] {
  const { etat, prise } = groupe;
  const parMoi = etat === "PRIS" && !!prise?.par_moi;
  const parAutre = etat === "PRIS" && !!prise && !prise.par_moi;
  // Serveur plus ancien : champ absent, lu comme « pas à confirmer ».
  const aConfirmer = !!groupe.a_confirmer;
  // Serveur plus ancien : signal absent, lu comme « aucun paiement signalé ».
  const signale = !!groupe.signaux?.paiement_signale;
  const confirmable = paniersAPayerEnLigne(groupe).length > 0;

  const actions: ActionRelance[] = [];
  if (etat === "A_RELANCER") actions.push("prendre");
  if (parMoi) actions.push("reprendre");
  if (confirmable && (parMoi || (signale && (!parAutre || estAdmin)))) actions.push("confirmer_paiement");
  if (parMoi || (parAutre && estAdmin)) actions.push("liberer");
  if (!parAutre || estAdmin) actions.push(aConfirmer ? "annuler" : "ignorer");
  actions.push("ouvrir");
  return actions;
}

/**
 * Paniers du groupe dont le paiement en ligne peut se confirmer : ni à payer
 * à la livraison (personne n'y paie en ligne), ni annulés par le client. La
 * tête d'abord, puis les autres dans l'ordre du serveur. Le serveur refait
 * le même contrôle (409).
 */
export function paniersAPayerEnLigne(groupe: Partial<Pick<GroupeRelance, "tete" | "autres">>): BrouillonLigne[] {
  return [groupe.tete, ...(groupe.autres ?? [])].filter(
    (b): b is BrouillonLigne => !!b && !b.paiement_a_la_livraison && !b.annulee_par_client,
  );
}

/**
 * Panier proposé à l'ouverture de « Confirmer le paiement » : celui du
 * paiement signalé s'il est confirmable, sinon le premier panier payable en
 * ligne (la tête, le plus souvent). Null si aucun ne l'est.
 */
export function panierAConfirmerParDefaut(
  groupe: Partial<Pick<GroupeRelance, "tete" | "autres" | "signaux">>,
): BrouillonLigne | null {
  const paniers = paniersAPayerEnLigne(groupe);
  const signale = groupe.signaux?.paiement_signale ?? null;
  return (signale && paniers.find((b) => b.id === signale.order_id)) || paniers[0] || null;
}

/**
 * Reprise d'une commande du site à payer à la livraison, à confirmer ou
 * annulée par le client : personne n'a payé en ligne, la question « a-t-il
 * été débité ? » n'a pas de sens. On confirme la commande avec le client.
 */
export const repriseALaLivraison = (groupe: Pick<GroupeRelance, "a_confirmer" | "tete">): boolean =>
  !!groupe.a_confirmer || !!groupe.tete?.paiement_a_la_livraison;
