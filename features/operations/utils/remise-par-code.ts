/**
 * REMISE AU LIVREUR PAR LE CODE DE RETRAIT (fenêtre « Récupération · code 123 »
 * de l'écran Opérations).
 *
 * Depuis le 24/10 au soir, la caissière ne saisit plus le code : le livreur
 * le lui dit, elle touche « Confirmer la récupération » sur le groupe de la
 * course et valide dans la même fenêtre qu'avant, le code en grand. La
 * fenêtre lit la course par son identifiant ; ces règles restent celles du
 * serveur.
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
  order_id?: string | null;
  order: {
    id?: string | null;
    status: string;
    reference?: string | null;
    fullname?: string | null;
    amount?: number | null;
  };
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

/**
 * Libellés alignés sur le mapper `orderMapper.ts` de la page Commandes :
 * aucune divergence tolérée, on affiche partout exactement ce que la page
 * Commandes affiche pour un statut donné.
 */
const STATUT_COMMANDE: Record<string, string> = {
  PENDING: 'EN ATTENTE',
  ACCEPTED: 'NOUVELLE',
  IN_PROGRESS: 'EN PRÉPARATION',
  READY: 'PRÊT',
  PICKED_UP: 'EN LIVRAISON',
  COLLECTED: 'RÉCUPÉRÉE',
  COMPLETED: 'TERMINÉE',
  CANCELLED: 'ANNULÉE',
};

/** Pastille à droite de la ligne d'une commande dans la fenêtre (mêmes mots qu'avant). */
export function libellePastille(livraison: LivraisonRemise, etat: EtatRemise, complementaire: boolean): string {
  switch (etat) {
    case 'A_REMETTRE':
      return complementaire ? 'À REMETTRE' : 'PRÊT';
    case 'DEJA_REMISE':
      return 'DÉJÀ REMISE';
    case 'TERMINEE':
      return 'TERMINÉE';
    default:
      return STATUT_COMMANDE[livraison.order?.status ?? ''] ?? 'INCONNU';
  }
}

/** « Koffi Yao · 12 500 F » sous la référence (mise en forme de la fenêtre d'avant). */
export function texteClientMontant(livraison: LivraisonRemise): string {
  const montant = typeof livraison.order?.amount === 'number' && Number.isFinite(livraison.order.amount) ? livraison.order.amount : 0;
  return `${livraison.order?.fullname || 'Client'} · ${montant.toLocaleString('fr-FR')} F`;
}

/** Identifiant de la commande d'une livraison. */
const idCommande = (d: LivraisonRemise): string | null => d.order?.id || d.order_id || null;

/**
 * Commandes que la validation remet (`order_ids` de `POST
 * /courses/operations/:id/recuperation`) : celles « à remettre » dans la
 * fenêtre, sans doublon.
 */
export function commandesARemettre(course: CourseRemise): string[] {
  const complementaire = estRetraitComplementaire(course);
  const ids: string[] = [];
  for (const d of course.deliveries ?? []) {
    const id = idCommande(d);
    if (id && etatRemise(d, complementaire) === 'A_REMETTRE' && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Ce que l'écran Commandes connaît d'une commande (sous-ensemble de `Order`). */
export interface CommandeDeLEcran {
  id: string;
  reference: string;
  status: string;
  amount?: number | null;
  fullname?: string | null;
  delivery?: { id?: string | null; statut?: string | null; course?: { id?: string | null } | null } | null;
}

/**
 * La course telle que l'écran la connaît déjà (ses commandes de la liste) :
 * la fenêtre s'ouvre tout de suite avec ces lignes, avant la lecture de la
 * course, et les garde si cette lecture échoue.
 */
export function courseRemiseDeLEcran(
  course: { id: string; statut: string },
  commandes: readonly CommandeDeLEcran[],
): CourseRemise {
  const deliveries: LivraisonRemise[] = [];
  for (const c of commandes) {
    const livraison = c.delivery;
    if (!livraison || livraison.course?.id !== course.id || livraison.statut === 'CANCELLED') continue;
    if (deliveries.some((d) => d.order.id === c.id)) continue;
    deliveries.push({
      id: livraison.id || c.id,
      statut: livraison.statut ?? null,
      order_id: c.id,
      order: { id: c.id, status: c.status, reference: c.reference, fullname: c.fullname ?? null, amount: c.amount ?? null },
    });
  }
  return { statut: course.statut, deliveries };
}
