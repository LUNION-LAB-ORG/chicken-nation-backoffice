/**
 * REMISE AU LIVREUR PAR LE CODE DE RETRAIT (fenêtre « Récupération · code 123 »
 * de l'écran Opérations).
 *
 * Deux cas, les mêmes que le serveur (`CourseActionService.validatePickupByCashier`,
 * backend) :
 *  - RETRAIT : course acceptée (ou confiée à Turbo) pas encore récupérée.
 *    Toutes ses commandes doivent être prêtes, sinon le serveur refuse ;
 *  - RETRAIT COMPLÉMENTAIRE (planificateur v2, conception 3.8) : course déjà
 *    récupérée (`IN_DELIVERY`), livreur encore au comptoir, une commande lui a
 *    été ajoutée après le retrait. Le serveur ne la trouve par le code que dans
 *    ce cas (`whereCoursesARemettre`) et ne remet QUE les commandes prêtes,
 *    avec le même code ; celles déjà remises sont ignorées.
 *
 * Avant ce module, la fenêtre appliquait la règle du retrait aux deux cas :
 * pour un retrait complémentaire, la commande déjà remise comptait comme « pas
 * encore prête » et grisait le bouton. Le livreur partait sans la commande
 * ajoutée (relecture du 23/10, constat « retrait complémentaire impossible
 * depuis le backoffice »).
 *
 * Fichier pur : testé par `bun test`.
 */

/** Ce que la fenêtre lit d'une livraison de la course (sous-ensemble de `Delivery`). */
export interface LivraisonRemise {
  id: string;
  statut?: string | null;
  order: { status: string; reference?: string | null };
}

/** Ce que la fenêtre lit de la course trouvée par le code (sous-ensemble de `Course`). */
export interface CourseRemise {
  statut: string;
  deliveries: LivraisonRemise[];
}

/**
 *  - `A_REMETTRE` : prête, la caisse la remet maintenant ;
 *  - `DEJA_REMISE` : remise au premier retrait (retrait complémentaire) ;
 *  - `PAS_PRETE` : encore en cuisine (ou statut inattendu) ;
 *  - `TERMINEE` : livraison finie ou annulée (retrait complémentaire).
 */
export type EtatRemise = 'A_REMETTRE' | 'DEJA_REMISE' | 'PAS_PRETE' | 'TERMINEE';

/** Commande déjà remise au livreur (ou au client). */
const COMMANDE_REMISE = new Set(['PICKED_UP', 'COLLECTED', 'COMPLETED']);

/** Livraison qui n'a plus rien à remettre. */
const LIVRAISON_TERMINEE = new Set(['DELIVERED', 'FAILED', 'CANCELLED']);

/** Course déjà récupérée : le code sert à remettre une commande ajoutée après le retrait. */
export function estRetraitComplementaire(course: Pick<CourseRemise, 'statut'>): boolean {
  return course.statut === 'IN_DELIVERY';
}

export function etatRemise(livraison: LivraisonRemise, complementaire: boolean): EtatRemise {
  const statutCommande = livraison.order?.status;
  if (!complementaire) return statutCommande === 'READY' ? 'A_REMETTRE' : 'PAS_PRETE';
  if (livraison.statut && LIVRAISON_TERMINEE.has(livraison.statut)) return 'TERMINEE';
  if (COMMANDE_REMISE.has(statutCommande)) return 'DEJA_REMISE';
  return statutCommande === 'READY' ? 'A_REMETTRE' : 'PAS_PRETE';
}

const commandes = (n: number) => (n > 1 ? `${n} commandes` : `${n} commande`);

export interface RemiseParCode {
  complementaire: boolean;
  /** Commandes que la validation remet maintenant. */
  aRemettre: number;
  /** Commandes encore en cuisine. */
  pasPretes: number;
  /** Le bouton est actif : le serveur acceptera la validation. */
  peutValider: boolean;
  /** Bilan du pied de la fenêtre. */
  bilan: string;
  /** Vert : la caisse peut remettre ; ambre : attendre. */
  ton: 'vert' | 'ambre';
  /** Libellé du bouton. */
  bouton: string;
}

export function remiseParCode(course: CourseRemise): RemiseParCode {
  const complementaire = estRetraitComplementaire(course);
  const etats = (course.deliveries ?? []).map((d) => etatRemise(d, complementaire));
  const aRemettre = etats.filter((e) => e === 'A_REMETTRE').length;
  const pasPretes = etats.filter((e) => e === 'PAS_PRETE').length;

  if (!complementaire) {
    // Règle du serveur : toutes les commandes prêtes, sinon refus.
    const peutValider = pasPretes === 0;
    return {
      complementaire,
      aRemettre,
      pasPretes,
      peutValider,
      bilan: peutValider
        ? 'Toutes les commandes sont prêtes'
        : `${commandes(pasPretes)} pas encore ${pasPretes > 1 ? 'prêtes' : 'prête'}`,
      ton: peutValider ? 'vert' : 'ambre',
      bouton: 'Valider la récupération',
    };
  }

  // Retrait complémentaire : les commandes prêtes sont remises, les autres
  // n'empêchent rien (le serveur les ignore).
  const peutValider = aRemettre > 0;
  const enCuisine = pasPretes > 0 ? `, ${commandes(pasPretes)} encore en cuisine` : '';
  return {
    complementaire,
    aRemettre,
    pasPretes,
    peutValider,
    bilan: peutValider
      ? `${commandes(aRemettre)} à remettre au livreur${enCuisine}`
      : pasPretes > 0
        ? `Rien à remettre pour l'instant${enCuisine}`
        : 'Tout est déjà remis au livreur',
    ton: peutValider ? 'vert' : 'ambre',
    bouton: 'Remettre au livreur',
  };
}

/** Texte de confirmation après une validation réussie. */
export function texteRemiseValidee(course: Partial<Pick<CourseRemise, 'statut'>> | null | undefined): string {
  return course?.statut === 'IN_DELIVERY'
    ? 'Commande remise : le livreur peut partir'
    : 'Course validée : le livreur peut partir en livraison';
}
