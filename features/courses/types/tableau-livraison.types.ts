import type { CourseStatut } from './course.types';

/**
 * TABLEAU DE LA LIVRAISON : réponse de `GET /livraison/tableau` (conception du
 * 24/10, 11.4 ; serveur `tableau-livraison.rules.ts`).
 *
 * Une seule lecture nourrit le bandeau des restaurants, la ligne Livreurs de
 * l'écran Commandes, « À surveiller », « À traiter » et la pastille du menu.
 * Les alertes (`signaux`) sont calculées par le serveur, avec ses réglages.
 *
 * Sans paramètre : le siège reçoit tous les restaurants actifs, un compte de
 * restaurant le sien. Route absente sur un serveur plus ancien (404) : les
 * blocs qui en dépendent ne s'affichent pas.
 */

export type CleSignal =
  | 'TOURNEE_EN_RETARD'
  | 'SANS_LIVREUR'
  | 'PARTI_SANS_SAC'
  | 'COURSE_ANNULEE_A_RELANCER'
  | 'ATTENTE_AU_RESTAURANT'
  | 'APPLI_FERMEE_EN_COURSE'
  | 'POSITION_PERDUE_EN_COURSE'
  | 'A_ENCAISSER'
  | 'PREVU_PAS_EN_SERVICE';

/** Rouge : agir maintenant. Ambre : surveiller. */
export type GraviteSignal = 'rouge' | 'ambre';

export interface SignalLivraison {
  cle: CleSignal;
  gravite: GraviteSignal;
  restaurant_id: string;
  /** Début du problème (ISO). */
  depuis: string | null;
  /** Minutes pleines depuis `depuis` ; retard au-delà de la fin prévue pour une tournée. */
  minutes: number | null;
  course: { id: string; reference: string; statut: CourseStatut; expiree: boolean } | null;
  livreur: { id: string; prenom: string | null } | null;
  /** Références des commandes concernées. */
  commandes: string[];
  /** PREVU_PAS_EN_SERVICE : créneau prévu. */
  creneau?: 'MORNING' | 'EVENING';
  /** APPLI_FERMEE_EN_COURSE : dernier signe de vie de l'appli (ISO). */
  appli_vue_a?: string | null;
}

export interface LivreurDuTableau {
  id: string;
  prenom: string | null;
  /**
   * État par la règle unique du serveur. Il peut en envoyer un que cet écran
   * ne connaît pas (`INJOIGNABLE` : ni connexion ni jeton de notification) :
   * `etatAffichable` le range.
   */
  etat: string;
  /** Place dans la file de CE restaurant, parmi les livreurs disponibles. */
  rang_file: number | null;
  course: { reference: string; statut: CourseStatut } | null;
}

export interface RestaurantDuTableau {
  id: string;
  nom: string;
  livreurs: {
    /** Disponible, Offre en attente. */
    disponibles: number;
    en_course: number;
    /** En pause, Pause automatique. */
    en_pause: number;
    /** Appli fermée (injoignables compris). */
    appli_fermee: number;
    /** Tous sauf Hors service et Inactif. */
    en_service: number;
    /** Livreurs prévus aujourd'hui ; null sans planning envoyé ou confirmé pour ce jour. */
    prevus: number | null;
  };
  sans_livreur: { courses: number; plus_ancienne_depuis: string | null };
  jour: { livrees: number; duree_moyenne_s: number | null };
  /** Signaux rouges du restaurant. */
  alertes: number;
  /** Livreurs actifs et opérationnels, rangés par état puis place dans la file. */
  liste: LivreurDuTableau[];
}

export interface TableauLivraison {
  genere_a: string;
  restaurants: RestaurantDuTableau[];
  /** Rouges d'abord, puis le plus ancien. */
  signaux: SignalLivraison[];
}
