/**
 * « RELANCER LA LIVRAISON » D'UNE LIVRAISON ANNULÉE PAR LE LIVREUR (demande du
 * 28/10, contrat `relancer-livraison-contrat.md`, partie B).
 *
 * Le livreur a touché « Annuler » : la commande reste en livraison, le sac est
 * chez lui. Le siège (administrateur, centre d'appels) a trouvé une solution
 * avec le client : la même livraison repart avec le même livreur, sans
 * passage au restaurant (`POST /courses/commandes/:orderId/relancer-livraison`,
 * corps vide). S'il est en tournée, elle rejoint la fin de sa tournée ; sinon
 * une course est créée pour lui, déjà en livraison. La commande ne bouge pas.
 *
 * « Sac rapporté » (la commande redevient prête) reste à côté, inchangé.
 *
 * Droit du geste : `piloterCourses`, miroir de `ROLES_ACTIONS_COURSES` du
 * serveur (ADMIN, CALL_CENTER). Jamais le restaurant : il n'a pas le client
 * au téléphone, son geste est « Sac rapporté ».
 *
 * Fichier pur : testé par `bun test`.
 */

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import type { DroitsLivraison } from '../../livreurs/utils/droits-livraison';

/**
 * Réponse du geste. `rang` : place dans la tournée (1 à N) ; `demarree` :
 * livraison mise en route tout de suite ; `appli_connectee` : `false`, le
 * livreur est prévenu par notification seulement, `null` : inconnu ;
 * `deja` : rejeu (double toucher), rien n'a été refait.
 */
export interface ReponseRelanceLivraison {
  order_id: string;
  reference: string;
  course_id: string;
  course_reference: string;
  nouvelle_course: boolean;
  rang: number;
  demarree: boolean;
  livreur: { id: string; prenom: string | null } | null;
  appli_connectee: boolean | null;
  deja: boolean;
}

/** Les mots d'avant : ceux de « Relancer la livraison » d'une course annulée. */
export const LIBELLE_RELANCER_LIVRAISON = 'Relancer la livraison';

/**
 * Toast de réussite (et de rejeu) : « Livraison relancée : ORD-123 avec
 * Koffi » ; sans prénom « Livraison relancée : ORD-123 » ; appli du livreur
 * pas connectée : « , par notification » à la fin.
 */
export function texteLivraisonRelancee(
  reponse: Partial<ReponseRelanceLivraison> | null | undefined,
  referenceRepli?: string | null,
): string {
  const reference = reponse?.reference || referenceRepli || null;
  const prenom = reponse?.livreur?.prenom?.trim();
  let texte = reference ? `Livraison relancée : ${reference}` : 'Livraison relancée';
  if (prenom) texte += ` avec ${prenom}`;
  if (reponse?.appli_connectee === false) texte += ', par notification';
  return texte;
}

/** Qui voit le bouton : ceux qui pilotent les courses (ADMIN, CALL_CENTER). */
export function peutRelancerLivraison(droits: Pick<DroitsLivraison, 'piloterCourses'> | null | undefined): boolean {
  return droits?.piloterCourses === true;
}

export type GesteSac = 'RELANCER_LIVRAISON' | 'SAC_RAPPORTE';

/**
 * Rangée du tiroir sous « Sac à rapporter par Koffi » : les deux gestes
 * (l'administrateur) sur deux colonnes, Relancer à gauche ; un seul (centre
 * d'appels : Relancer ; restaurant : Sac rapporté) en pleine largeur.
 */
export function gestesSacARapporter(
  peutRelancer: boolean,
  peutRapporter: boolean,
): { gestes: GesteSac[]; deuxColonnes: boolean } {
  const gestes: GesteSac[] = [];
  if (peutRelancer) gestes.push('RELANCER_LIVRAISON');
  if (peutRapporter) gestes.push('SAC_RAPPORTE');
  return { gestes, deuxColonnes: gestes.length === 2 };
}
