import type { GroupeRelance } from "../types/relance.types";

/**
 * Boutons d'une relance, dans l'ordre de l'écran. Logique pure, testée seule
 * (`__tests__/relance-a-confirmer.test.ts`) : la ligne ne fait que les rendre.
 *
 *  - `prendre` : « Je m'en occupe », sur un groupe à relancer ;
 *  - `reprendre` : « Reprendre au téléphone », sur la prise de l'agent ;
 *  - `liberer` : sa propre prise, ou celle d'un collègue pour l'ADMIN ;
 *  - `ignorer` : sauf la prise d'un collègue (l'ADMIN passe), et JAMAIS sur
 *    une commande à confirmer : elle resterait en attente pour toujours, le
 *    client verrait « À confirmer » sans fin (le serveur répond 409) ;
 *  - `annuler` : « Annuler la commande », à sa place, réservé à la commande
 *    à confirmer, avec la même garde sur la prise d'un collègue ;
 *  - `ouvrir` : toujours.
 */
export type ActionRelance = "prendre" | "reprendre" | "liberer" | "ignorer" | "annuler" | "ouvrir";

export function actionsRelance(
  groupe: Pick<GroupeRelance, "etat" | "prise" | "a_confirmer">,
  { estAdmin }: { estAdmin: boolean },
): ActionRelance[] {
  const { etat, prise } = groupe;
  const parMoi = etat === "PRIS" && !!prise?.par_moi;
  const parAutre = etat === "PRIS" && !!prise && !prise.par_moi;
  // Serveur plus ancien : champ absent, lu comme « pas à confirmer ».
  const aConfirmer = !!groupe.a_confirmer;

  const actions: ActionRelance[] = [];
  if (etat === "A_RELANCER") actions.push("prendre");
  if (parMoi) actions.push("reprendre");
  if (parMoi || (parAutre && estAdmin)) actions.push("liberer");
  if (!parAutre || estAdmin) actions.push(aConfirmer ? "annuler" : "ignorer");
  actions.push("ouvrir");
  return actions;
}

/**
 * Reprise d'une commande du site à payer à la livraison, à confirmer ou
 * annulée par le client : personne n'a payé en ligne, la question « a-t-il
 * été débité ? » n'a pas de sens. On confirme la commande avec le client.
 */
export const repriseALaLivraison = (groupe: Pick<GroupeRelance, "a_confirmer" | "tete">): boolean =>
  !!groupe.a_confirmer || !!groupe.tete?.paiement_a_la_livraison;
