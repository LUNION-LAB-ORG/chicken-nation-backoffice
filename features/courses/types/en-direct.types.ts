/**
 * Courses « En direct » (`GET /courses/en-direct`, demande du 10/11) : le
 * kanban de l'écran Courses. Une carte par course de la journée de service.
 */

export type ColonneEnDirect = 'A_AFFECTER' | 'VERS_RESTAURANT' | 'AU_RESTAURANT' | 'EN_LIVRAISON' | 'TERMINEE';

export interface CourseEnDirect {
  id: string;
  reference: string;
  /** Code de retrait à 3 chiffres. */
  code: string | null;
  statut: string;
  colonne: ColonneEnDirect;
  restaurant: { id: string; nom: string | null };
  livreur: { id: string; prenom: string | null; nom: string | null; telephone: string | null } | null;
  /** Confiée à Turbo : le livreur ne se change pas ici. */
  turbo: boolean;
  /** « Aucun livreur trouvé ». */
  expiree: boolean;
  /** Offre en attente chez ce livreur (prénom). */
  proposee_a: string | null;
  commandes: { total: number; livrees: number; references: string[] };
  /** Début de l'étape de la colonne (ISO). */
  depuis: string | null;
  fin_prevue: string | null;
  retard_min: number | null;
  frais: number;
  /** Avant le départ du restaurant, sans Turbo. */
  livreur_modifiable: boolean;
}

export interface CoursesEnDirect {
  genere_a: string;
  courses: CourseEnDirect[];
  terminees_total: number;
}
