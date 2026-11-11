/**
 * Courses « En direct » (`GET /courses/en-direct`, demande du 10/11) : le
 * kanban de l'écran Courses. Une carte par course de la journée de service.
 */

/** Retour du 10/11 : sans les terminées, trois étapes, Turbo à part. */
export type ColonneEnDirect = 'A_AFFECTER' | 'LIVREUR_AFFECTE' | 'EN_LIVRAISON' | 'TURBO';

/** Où en est la course, quelle que soit sa colonne. */
export type EtapeEnDirect = 'RECHERCHE' | 'AUCUN_LIVREUR' | 'VERS_RESTAURANT' | 'AU_RESTAURANT' | 'EN_LIVRAISON';

export interface CourseEnDirect {
  id: string;
  reference: string;
  /** Code de retrait à 3 chiffres. */
  code: string | null;
  statut: string;
  colonne: ColonneEnDirect;
  etape: EtapeEnDirect;
  restaurant: { id: string; nom: string | null };
  livreur: { id: string; prenom: string | null; nom: string | null; telephone: string | null } | null;
  /** Confiée à Turbo : le livreur ne se change pas ici. */
  turbo: boolean;
  /** « Aucun livreur trouvé ». */
  expiree: boolean;
  /** Offre en attente chez ce livreur (prénom). */
  proposee_a: string | null;
  commandes: {
    total: number;
    livrees: number;
    references: string[];
    /** Détail déplié sur la carte (11/11) ; absent d'un serveur plus ancien. */
    liste?: CommandeDeLaCourse[];
  };
  /** Début de l'étape de la colonne (ISO). */
  depuis: string | null;
  fin_prevue: string | null;
  retard_min: number | null;
  frais: number;
  /** Avant le départ du restaurant, sans Turbo. */
  livreur_modifiable: boolean;
}

export interface CommandeDeLaCourse {
  id: string | null;
  reference: string;
  /** Tous frais compris. */
  montant: number;
  /** Prénom et nom du client, sinon le nom saisi ; null sans nom. */
  client: string | null;
  livree: boolean;
  annulee: boolean;
}

export interface CoursesEnDirect {
  genere_a: string;
  courses: CourseEnDirect[];
}
