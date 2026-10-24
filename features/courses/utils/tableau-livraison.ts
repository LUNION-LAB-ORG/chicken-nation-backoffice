/**
 * TABLEAU DE LA LIVRAISON À L'ÉCRAN (conception du 24/10, sections 5, 8 et
 * 10.1), règles pures testées par `bun test`.
 *
 *  - qui peut lire `GET /livraison/tableau` (mêmes rôles que le serveur) ;
 *  - serveur pas à jour : route absente (404), le bloc ne s'affiche pas ;
 *  - carte « Tous les restaurants » du bandeau : sommes, moyenne pondérée
 *    par les livrées ;
 *  - couleur du chiffre « Sans livreur », pied de carte, nombre d'alertes ;
 *  - « À traiter » de Courses : alertes qui portent une course, et les gestes
 *    proposés pour chacune.
 */

import type { EtatDisponibilite } from '../../livreurs/types/livreur.types';
import { etatConnu } from '../../livreurs/utils/disponibilite';
import type { CleSignal, RestaurantDuTableau, SignalLivraison, TableauLivraison } from '../types/tableau-livraison.types';

// ============================================================
// QUI LIT, SERVEUR PAS À JOUR
// ============================================================

/**
 * Rôles admis par `GET /livraison/tableau` (serveur,
 * `livraison-tableau.controller.ts`). Le centre d'appels et la cuisine
 * recevraient 403 : la requête ne part pas pour eux.
 */
const ROLES_TABLEAU = ['ADMIN', 'LIVRAISON_OPS', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER'];

export function peutLireTableau(membre: { role?: string | null } | null | undefined): boolean {
  return ROLES_TABLEAU.includes(membre?.role ?? '');
}

/** Le serveur n'a pas encore la route (404) : rien n'est affiché, rien n'est inventé. */
export function estRouteAbsente(erreur: unknown): boolean {
  return !!erreur && typeof erreur === 'object' && (erreur as { status?: unknown }).status === 404;
}

// ============================================================
// ÉTAT D'UN LIVREUR DU TABLEAU
// ============================================================

/**
 * État à montrer, par la règle commune (`etatConnu`) : « En appel » avec sa
 * pastille, « Injoignable » avec les applis fermées (le serveur les compte
 * ainsi), un état inconnu « Hors service », jamais « Disponible ».
 */
export function etatAffichable(etat: string | null | undefined): EtatDisponibilite {
  return etatConnu(etat);
}

// ============================================================
// DURÉES
// ============================================================

/** « 9 min », « 1 h 05 ». */
export function dureeLisible(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}

/** Minutes pleines depuis `iso` (0 si l'horloge du poste retarde), null sans date. */
export function minutesDepuis(iso: string | null | undefined, maintenant: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((maintenant.getTime() - t) / 60_000));
}

// ============================================================
// BANDEAU DES RESTAURANTS
// ============================================================

export const NOM_TOUS_LES_RESTAURANTS = 'Tous les restaurants';

const plusAncienne = (a: string | null, b: string | null): string | null => {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) <= Date.parse(b) ? a : b;
};

/**
 * Carte « Tous les restaurants » : sommes des restaurants ; durée moyenne
 * pondérée par les livrées ; prévus null si aucun restaurant n'a de planning.
 */
export function totalDuReseau(restaurants: readonly RestaurantDuTableau[]): RestaurantDuTableau {
  let livreesAvecDuree = 0;
  let dureeTotale = 0;
  let prevus: number | null = null;
  const total: RestaurantDuTableau = {
    id: '',
    nom: NOM_TOUS_LES_RESTAURANTS,
    livreurs: { disponibles: 0, en_course: 0, en_pause: 0, appli_fermee: 0, en_service: 0, prevus: null },
    sans_livreur: { courses: 0, plus_ancienne_depuis: null },
    jour: { livrees: 0, duree_moyenne_s: null },
    alertes: 0,
    liste: [],
  };
  for (const r of restaurants) {
    total.livreurs.disponibles += r.livreurs.disponibles;
    total.livreurs.en_course += r.livreurs.en_course;
    total.livreurs.en_pause += r.livreurs.en_pause;
    total.livreurs.appli_fermee += r.livreurs.appli_fermee;
    total.livreurs.en_service += r.livreurs.en_service;
    if (r.livreurs.prevus !== null) prevus = (prevus ?? 0) + r.livreurs.prevus;
    total.sans_livreur.courses += r.sans_livreur.courses;
    total.sans_livreur.plus_ancienne_depuis = plusAncienne(
      total.sans_livreur.plus_ancienne_depuis,
      r.sans_livreur.plus_ancienne_depuis,
    );
    total.jour.livrees += r.jour.livrees;
    if (r.jour.duree_moyenne_s !== null && r.jour.livrees > 0) {
      livreesAvecDuree += r.jour.livrees;
      dureeTotale += r.jour.duree_moyenne_s * r.jour.livrees;
    }
    total.alertes += r.alertes;
    total.liste.push(...r.liste);
  }
  total.livreurs.prevus = prevus;
  total.jour.duree_moyenne_s = livreesAvecDuree > 0 ? Math.round(dureeTotale / livreesAvecDuree) : null;
  return total;
}

/** « 1 alerte », « 3 alertes » ; rien à zéro. */
export function libelleAlertes(n: number): string | null {
  if (n <= 0) return null;
  return n === 1 ? '1 alerte' : `${n} alertes`;
}

export type TonSansLivreur = 'aucun' | 'ambre' | 'rouge';

/**
 * Chiffre « Sans livreur » : ambre dès une course ; rouge si aucun livreur
 * n'est disponible, ou si l'attente a dépassé le seuil du serveur
 * (`course.no_deliverer_alert_after_min`), c'est-à-dire si le serveur a
 * passé son alerte « Sans livreur » au rouge. `restaurantId` null : tout le
 * réseau (carte « Tous les restaurants »).
 */
export function tonSansLivreur(
  r: RestaurantDuTableau,
  signaux: readonly SignalLivraison[],
  restaurantId: string | null,
): TonSansLivreur {
  if (r.sans_livreur.courses <= 0) return 'aucun';
  if (r.livreurs.disponibles <= 0) return 'rouge';
  const rouge = signaux.some(
    (s) =>
      s.cle === 'SANS_LIVREUR' && s.gravite === 'rouge' && (restaurantId === null || s.restaurant_id === restaurantId),
  );
  return rouge ? 'rouge' : 'ambre';
}

/**
 * Pied d'une carte : « Livrées 38 · 31 min en moyenne · 4 en service sur 6
 * prévus » ; sans livraison « Livrées 0 » ; sans planning, rien sur les prévus.
 */
export function piedCarte(r: RestaurantDuTableau): string {
  const parties = [`Livrées ${r.jour.livrees}`];
  if (r.jour.livrees > 0 && r.jour.duree_moyenne_s !== null) {
    parties.push(`${dureeLisible(r.jour.duree_moyenne_s / 60)} en moyenne`);
  }
  const prevus = r.livreurs.prevus;
  if (prevus !== null) {
    parties.push(`${r.livreurs.en_service} en service sur ${prevus} ${prevus > 1 ? 'prévus' : 'prévu'}`);
  }
  return parties.join(' · ');
}

// ============================================================
// ALERTES
// ============================================================

/** Alertes d'un restaurant, ou de tout le périmètre (`null`). L'ordre du serveur est gardé. */
export function signauxDuRestaurant(
  signaux: readonly SignalLivraison[],
  restaurantId: string | null | undefined,
): SignalLivraison[] {
  return restaurantId ? signaux.filter((s) => s.restaurant_id === restaurantId) : [...signaux];
}

/**
 * Pastille du menu : alertes rouges de tout le périmètre du compte, même
 * quand un restaurant est choisi (hypothèse 6 de la conception).
 */
export function nombreAlertesRouges(tableau: TableauLivraison | null | undefined): number {
  return tableau?.signaux?.filter((s) => s.gravite === 'rouge').length ?? 0;
}

// ============================================================
// « À TRAITER » (COURSES)
// ============================================================

/** Alertes qui portent une course : celles que l'écran Courses montre. */
const CLES_A_TRAITER: ReadonlySet<CleSignal> = new Set<CleSignal>([
  'SANS_LIVREUR',
  'TOURNEE_EN_RETARD',
  'PARTI_SANS_SAC',
  'ATTENTE_AU_RESTAURANT',
  'COURSE_ANNULEE_A_RELANCER',
]);

export function signauxATraiter(
  signaux: readonly SignalLivraison[],
  restaurantId: string | null | undefined,
): SignalLivraison[] {
  return signauxDuRestaurant(signaux, restaurantId).filter((s) => CLES_A_TRAITER.has(s.cle) && !!s.course);
}

export type ActionATraiter = 'FORCER' | 'TURBO' | 'RELANCER_RECHERCHE' | 'RELANCER_LIVRAISON';

/** Course sans livreur dont la recherche est finie (« Aucun livreur trouvé »). */
export function estExpiree(s: SignalLivraison): boolean {
  return !!s.course && (s.course.expiree || s.course.statut === 'EXPIRED');
}

/**
 * Gestes proposés sur une ligne « À traiter », pour qui pilote les courses
 * (l'admin) ; les mêmes que la fiche de la course :
 *  - recherche en cours : « Forcer l'affectation », « Confier à Turbo » ;
 *  - recherche finie : « Relancer la recherche » ;
 *  - course annulée, commande à relancer : « Relancer la livraison » ;
 *  - les autres : rien, la fiche de la course suffit.
 */
export function actionsATraiter(s: SignalLivraison): ActionATraiter[] {
  if (!s.course) return [];
  if (s.cle === 'SANS_LIVREUR') {
    if (estExpiree(s)) return ['RELANCER_RECHERCHE'];
    return s.course.statut === 'PENDING_ASSIGNMENT' ? ['FORCER', 'TURBO'] : [];
  }
  if (s.cle === 'COURSE_ANNULEE_A_RELANCER') return ['RELANCER_LIVRAISON'];
  return [];
}
