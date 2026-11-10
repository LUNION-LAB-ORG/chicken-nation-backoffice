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
import type {
  CleSignal,
  LivreurDuTableau,
  RestaurantDuTableau,
  SignalLivraison,
  TableauLivraison,
} from '../types/tableau-livraison.types';

// ============================================================
// QUI LIT, SERVEUR PAS À JOUR
// ============================================================

/**
 * Rôles admis par `GET /livraison/tableau` (serveur,
 * `livraison-tableau.controller.ts`). Le centre d'appels y est depuis le
 * 26/10 (module Livraison en lecture) ; la cuisine et le marketing
 * recevraient 403 : la requête ne part pas pour eux. Sur un serveur plus
 * ancien, le centre d'appels n'a pas la lecture des livreurs : ni menu, ni
 * guetteur, la requête ne part pas non plus.
 */
const ROLES_TABLEAU = ['ADMIN', 'LIVRAISON_OPS', 'CALL_CENTER', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER'];

export function peutLireTableau(membre: { role?: string | null } | null | undefined): boolean {
  return ROLES_TABLEAU.includes(membre?.role ?? '');
}

/** Le serveur n'a pas encore la route (404) : rien n'est affiché, rien n'est inventé. */
export function estRouteAbsente(erreur: unknown): boolean {
  return !!erreur && typeof erreur === 'object' && (erreur as { status?: unknown }).status === 404;
}

export type AffichageBandeau = 'onglets' | 'rien' | 'erreur' | 'erreur_et_onglets' | 'squelettes' | 'cartes';

/**
 * Ce que montre le bandeau des restaurants. Compte du siège sans activité
 * lisible (route absente, ou erreur sans donnée en cache) : les onglets des
 * restaurants gardent le choix du restaurant, qui filtre aussi l'écran
 * (relecture du 25/10).
 */
export function affichageBandeau(etat: {
  compteDeRestaurant: boolean;
  peutLire: boolean;
  erreur: unknown;
  aDesDonnees: boolean;
  enErreur: boolean;
  enChargement: boolean;
}): AffichageBandeau {
  if (!etat.peutLire || estRouteAbsente(etat.erreur)) return etat.compteDeRestaurant ? 'rien' : 'onglets';
  if (etat.aDesDonnees) return 'cartes';
  if (etat.enErreur) return etat.compteDeRestaurant ? 'erreur' : 'erreur_et_onglets';
  return etat.enChargement ? 'squelettes' : 'rien';
}

// ============================================================
// ÉTAT D'UN LIVREUR DU TABLEAU
// ============================================================

/**
 * État à montrer, par la règle commune (`etatConnu`) : « En appel »,
 * « Connexion coupée » et « Injoignable » avec leur pastille, un état
 * inconnu « Hors service », jamais « Disponible ».
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
  const { activite, service } = lignesPiedCarte(r);
  return service ? `${activite} · ${service}` : activite;
}

/**
 * Le même pied en deux lignes pour la carte de 260 px : sur une seule, la fin
 * (« 4 en service sur 6 prévus ») était coupée (vérification à l'écran du
 * 24/10). `service` est nul sans planning du jour.
 */
export function lignesPiedCarte(r: RestaurantDuTableau): { activite: string; service: string | null } {
  const parties = [`Livrées ${r.jour.livrees}`];
  if (r.jour.livrees > 0 && r.jour.duree_moyenne_s !== null) {
    parties.push(`${dureeLisible(r.jour.duree_moyenne_s / 60)} en moyenne`);
  }
  const prevus = r.livreurs.prevus;
  const service =
    prevus !== null ? `${r.livreurs.en_service} en service sur ${prevus} ${prevus > 1 ? 'prévus' : 'prévu'}` : null;
  return { activite: parties.join(' · '), service };
}

/**
 * Mots des chiffres du bandeau compact (10/11), entiers et accordés : sur
 * l'ancienne carte de 260 px, « Disponibles » devenait « Disponibl… ».
 */
export function motsDesChiffres(r: RestaurantDuTableau): {
  disponibles: string;
  enCourse: string;
  enPause: string;
  nonAssignees: string;
} {
  return {
    disponibles: r.livreurs.disponibles > 1 ? 'disponibles' : 'disponible',
    enCourse: 'en course',
    enPause: 'en pause',
    nonAssignees: r.sans_livreur.courses > 1 ? 'non assignées' : 'non assignée',
  };
}

/**
 * Chiffres du bandeau qui se déplient (10/11 : « consulter les livreurs
 * selon les statuts en restant sur la même page ») : mêmes états que le
 * compte du serveur.
 */
export type GroupeChiffre = 'DISPONIBLES' | 'EN_COURSE' | 'EN_PAUSE';

export const ETATS_DU_GROUPE: Record<GroupeChiffre, readonly string[]> = {
  DISPONIBLES: ['DISPONIBLE', 'OFFRE_EN_ATTENTE', 'EN_APPEL'],
  EN_COURSE: ['EN_COURSE'],
  EN_PAUSE: ['EN_PAUSE', 'PAUSE_AUTO'],
};

export interface LivreurDuChiffre extends LivreurDuTableau {
  restaurant: { id: string; nom: string };
}

/** Livreurs d'un chiffre, du restaurant choisi ou de tous, dans l'ordre du serveur. */
export function livreursDuChiffre(
  restaurants: readonly RestaurantDuTableau[],
  restaurantId: string | null | undefined,
  groupe: GroupeChiffre,
): LivreurDuChiffre[] {
  const etats = ETATS_DU_GROUPE[groupe];
  return restaurants
    .filter((r) => !restaurantId || r.id === restaurantId)
    .flatMap((r) =>
      r.liste.filter((l) => etats.includes(l.etat)).map((l) => ({ ...l, restaurant: { id: r.id, nom: r.nom } })),
    );
}

/** « 16 livreurs en pause », « 1 livreur disponible », « Aucun livreur en course ». */
export function titreListeChiffre(groupe: GroupeChiffre, n: number): string {
  const etat = groupe === 'DISPONIBLES' ? (n > 1 ? 'disponibles' : 'disponible') : groupe === 'EN_COURSE' ? 'en course' : 'en pause';
  if (n === 0) return `Aucun livreur ${etat}`;
  return `${n} ${n > 1 ? 'livreurs' : 'livreur'} ${etat}`;
}

/**
 * Seconde ligne d'un livreur dans la liste dépliée : sa course, sa place
 * dans la file, ou le détail de son état (« En pause jusqu'à 14 h 32 »).
 */
export function detailDuLivreurDuChiffre(l: Pick<LivreurDuTableau, 'etat' | 'libelle' | 'course' | 'rang_file'>): string | null {
  if (l.course) return l.course.reference;
  if (l.rang_file) return l.rang_file === 1 ? '1er de la file' : `${l.rang_file}e de la file`;
  return l.libelle?.trim() || null;
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
  'LIVRAISON_ANNULEE_PAR_LIVREUR',
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
 *  - les autres : rien, la fiche de la course suffit. Livraison annulée par
 *    le livreur (27/10) : la commande est encore en livraison ; ses gestes
 *    portent la commande, pas la course, et sont à part :
 *    `relanceLivraisonDuSignal` (« Relancer la livraison » de la commande,
 *    28/10) et `sacRapporteDuSignal` (« Sac rapporté »).
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

/**
 * Livraison annulée par le livreur (27/10) : la commande reste en livraison
 * et c'est elle qu'il faut reprendre (« Annuler la commande », menu ⋮ du
 * tiroir). Une seule commande : toucher la ligne mène à elle. Plusieurs, ou
 * une autre alerte : `null`, la ligne ouvre la fiche de la course, dont les
 * références mènent chacune à leur commande.
 */
export function commandeDuSignal(s: SignalLivraison): string | null {
  if (s.cle !== 'LIVRAISON_ANNULEE_PAR_LIVREUR') return null;
  return s.commandes.length === 1 ? s.commandes[0] : null;
}

/**
 * « Sac rapporté » sur la ligne « Koffi a annulé ORD-1 · Client absent »
 * (demande du 28/10) : l'identifiant de LA commande, si l'alerte n'en porte
 * qu'une et que le serveur envoie `commandes_ids`. Plusieurs commandes, ids
 * absents (serveur ancien) ou autre alerte : `null`, pas de bouton ; la
 * fiche de la course mène à chaque commande, dont le tiroir porte le geste.
 * `actionsATraiter` ne change pas.
 */
export function sacRapporteDuSignal(s: SignalLivraison): string | null {
  return commandeUniqueAnnulee(s);
}

/**
 * « Relancer la livraison » sur la même ligne (demande du 28/10), à gauche de
 * « Sac rapporté » : même condition. La livraison annulée repart avec le même
 * livreur, sans passage au restaurant. Plusieurs commandes, ids absents ou
 * autre alerte : `null`, le tiroir de chaque commande porte le geste.
 */
export function relanceLivraisonDuSignal(s: SignalLivraison): string | null {
  return commandeUniqueAnnulee(s);
}

/** Identifiant de LA commande d'une livraison annulée par le livreur, ou `null`. */
function commandeUniqueAnnulee(s: SignalLivraison): string | null {
  if (s.cle !== 'LIVRAISON_ANNULEE_PAR_LIVREUR') return null;
  const ids = s.commandes_ids;
  if (s.commandes.length !== 1 || !Array.isArray(ids) || ids.length !== 1) return null;
  return typeof ids[0] === 'string' && ids[0] ? ids[0] : null;
}
