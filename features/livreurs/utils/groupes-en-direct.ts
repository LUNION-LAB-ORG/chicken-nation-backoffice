/**
 * EN DIRECT (conception du 24/10, section 9), règles pures testées par
 * `bun test`.
 *
 *  - « Livreurs » (9.3) : chaque livreur dans UNE section, la première qui le
 *    prend (En course, Au restaurant, Disponibles, En pause, Appli fermée,
 *    Hors service), avec sa ligne : détail et heure utile à droite ;
 *  - « À surveiller » (9.2) : alertes du serveur du restaurant choisi,
 *    rouges d'abord puis la plus ancienne, et ce que leur toucher ouvre ;
 *  - fenêtre du livreur sur la carte (9.4) : arrêts, fin de tournée,
 *    dernière position.
 *
 * Données de `GET /deliverers/live-locations` (serveur, 11.5). Un serveur
 * plus ancien n'a ni `rang_file`, ni l'heure d'arrivée au restaurant, ni la
 * fin prévue : la case reste vide, rien n'est inventé.
 *
 * Mots de la section 3.3 : « 1er de la file », « 2 sur 3 livrées »,
 * « vers le restaurant », « Au restaurant depuis 6 min », « jusqu'à
 * 14 h 32 », « vue il y a 6 min », « position ancienne », « Fin vers
 * 13 h 05 », « En retard de 12 min », « Dernière position 12 h 40 ».
 */

import type { SignalLivraison } from '../../courses/types/tableau-livraison.types';
import { DELIVERY_STATUT_LABELS } from '../../courses/utils/course-labels';
import { dureeLisible, minutesDepuis } from '../../courses/utils/tableau-livraison';
import { approcheLivreur, heureCourte, type PositionGps } from '../../operations/utils/suivi-course';
import { nomCourtRestaurant } from '../../restaurants/utils/nom-court';
import type { IDelivererLive, IDelivererLiveCourse, IDelivererLiveDelivery } from '../types/deliverer-live.type';
import type { EtatDisponibilite } from '../types/livreur.types';
import { NOM_ETAT, appliVueADe, estPauseSansFin, etatLivreurAffiche, heureLisible, rangEtat, vueIlYa } from './disponibilite';
import { avancementTournee, jusquA, placeDansLaFile, rangDuLivreur } from './livreurs-du-jour';

// ============================================================
// SECTIONS
// ============================================================

export type CleSection = 'EN_COURSE' | 'AU_RESTAURANT' | 'DISPONIBLES' | 'EN_PAUSE' | 'APPLI_FERMEE' | 'HORS_SERVICE';

export const ORDRE_SECTIONS: readonly CleSection[] = [
  'EN_COURSE',
  'AU_RESTAURANT',
  'DISPONIBLES',
  'EN_PAUSE',
  'APPLI_FERMEE',
  'HORS_SERVICE',
];

export const TITRES_SECTIONS: Record<CleSection, string> = {
  EN_COURSE: 'En course',
  AU_RESTAURANT: 'Au restaurant',
  DISPONIBLES: 'Disponibles',
  EN_PAUSE: 'En pause',
  APPLI_FERMEE: 'Appli fermée',
  HORS_SERVICE: 'Hors service',
};

/**
 * Section d'un livreur. La course passe avant l'état : un livreur qui porte
 * une course est dehors, quoi que dise sa pastille (au restaurant, en route
 * vers lui ou en tournée). Sans course : son état.
 */
export function sectionDuLivreur(
  etat: EtatDisponibilite,
  course: Pick<IDelivererLiveCourse, 'statut'> | null | undefined,
): CleSection {
  const statut = course?.statut;
  if (statut === 'AT_RESTAURANT') return 'AU_RESTAURANT';
  if (statut === 'ACCEPTED' || statut === 'IN_DELIVERY') return 'EN_COURSE';
  switch (etat) {
    case 'EN_COURSE':
      return 'EN_COURSE';
    case 'DISPONIBLE':
    case 'OFFRE_EN_ATTENTE':
    case 'EN_APPEL':
      return 'DISPONIBLES';
    case 'EN_PAUSE':
    case 'PAUSE_AUTO':
      return 'EN_PAUSE';
    case 'APPLI_FERMEE':
      return 'APPLI_FERMEE';
    default:
      return 'HORS_SERVICE';
  }
}

// ============================================================
// POSITION
// ============================================================

/** Une position `{ lat, lng }` (ou `latitude`, `longitude`) sur le globe, ou null. */
export function positionValable(valeur: unknown): PositionGps | null {
  if (!valeur || typeof valeur !== 'object') return null;
  const v = valeur as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
  const brutLat = v.lat ?? v.latitude;
  const brutLng = v.lng ?? v.longitude;
  if (brutLat === null || brutLat === undefined || brutLng === null || brutLng === undefined) return null;
  const lat = Number(brutLat);
  const lng = Number(brutLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  // 0,0 : coordonnées jamais saisies.
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

// ============================================================
// LIGNE D'UN LIVREUR
// ============================================================

export interface HeureUtile {
  /** « 13 h 05 », « 12 h 38 », « +12 min ». */
  texte: string;
  /** Rouge : tournée en retard. */
  retard: boolean;
  /** Au survol : « Fin vers 13 h 05 », « Arrivée vers 12 h 38 », « En retard de 12 min ». */
  titre: string;
  /** Fin prévue ou arrivée estimée (ms), pour le tri ; null si inconnue. */
  instant: number | null;
}

export interface LivreurEnDirect {
  id: string;
  live: IDelivererLive;
  /** « Awa Koné », sinon « Livreur ». */
  nom: string;
  etat: EtatDisponibilite;
  /** « En pause jusqu'à 14 h 32 »… : au survol de la pastille. */
  libelleEtat: string;
  section: CleSection;
  /** Place dans la file de son restaurant, null sans place. */
  rang: number | null;
  /** L2 ; vide : la ligne reste vide, la hauteur ne bouge pas. */
  detail: string;
  heure: HeureUtile | null;
  /** Position connue (même ancienne), null sans position. */
  position: PositionGps | null;
  /** Position plus récente que `deliverer.gps_expiration_minutes`. */
  positionRecente: boolean;
  /** Tri dans la section : groupe, puis valeur (nulle en dernier), puis nom. */
  tri: { groupe: number; valeur: number | null };
}

export interface ContexteEnDirect {
  maintenant: Date;
  /**
   * Un seul restaurant affiché : son nom ne précède pas L2, et la place
   * `queue_rank` d'un serveur ancien est juste.
   */
  unSeulRestaurant: boolean;
  /** Coordonnées des restaurants, quand le serveur ne les donne pas avec le livreur. */
  coordonneesRestaurants?: ReadonlyMap<string, PositionGps>;
}

const instant = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/** « Awa Koné », « Awa », sinon « Livreur ». */
export function nomDuLivreur(l: { first_name?: string | null; last_name?: string | null }): string {
  return [l.first_name, l.last_name].map((p) => (p ?? '').trim()).filter(Boolean).join(' ') || 'Livreur';
}

/** Les morceaux non vides, séparés par « · », majuscule en tête. */
function joindre(...parties: (string | null | undefined)[]): string {
  const texte = parties.filter((p): p is string => !!p && p.trim() !== '').join(' · ');
  return texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : '';
}

/** Coordonnées du restaurant du livreur : celles du serveur, sinon celles de la liste des restaurants. */
function coordonneesDuRestaurant(l: IDelivererLive, ctx: ContexteEnDirect): PositionGps | null {
  const r = l.restaurant;
  if (!r) return null;
  return positionValable({ lat: r.latitude, lng: r.longitude }) ?? ctx.coordonneesRestaurants?.get(r.id) ?? null;
}

/** Ce que dit L2, sans le restaurant ni la position ancienne. */
function detailDeSection(
  section: CleSection,
  etat: EtatDisponibilite,
  l: IDelivererLive,
  rang: number | null,
  maintenant: Date,
): string | null {
  const c = l.active_course;
  switch (section) {
    case 'EN_COURSE': {
      if (!c) return null;
      if (c.statut === 'ACCEPTED') return `${c.reference} · vers le restaurant`;
      const avancement = c.statut === 'IN_DELIVERY' ? avancementTournee(c.deliveries ?? []) : null;
      return avancement ? `${c.reference} · ${avancement}` : c.reference;
    }
    case 'AU_RESTAURANT': {
      const minutes = minutesDepuis(c?.at_restaurant_at, maintenant);
      return minutes === null ? 'au restaurant' : `au restaurant depuis ${dureeLisible(minutes)}`;
    }
    case 'DISPONIBLES':
      // Offre en attente, en appel : la pastille le dit, la ligne reste vide.
      return etat === 'DISPONIBLE' ? placeDansLaFile(rang) : null;
    case 'EN_PAUSE':
      return etat === 'PAUSE_AUTO'
        ? jusquA(l.disponibilite?.auto_pause_until ?? l.auto_pause_until, maintenant)
        : jusquA(l.disponibilite?.pause_until ?? l.pause_until, maintenant);
    case 'APPLI_FERMEE':
      return vueIlYa(appliVueADe(l), maintenant);
    default:
      return null;
  }
}

/**
 * Heure à droite de L1 : tournée partie, la fin prévue « 13 h 05 » ou, en
 * retard, « +12 min » en rouge ; vers le restaurant, l'arrivée estimée
 * « 12 h 38 ». Rien sinon.
 */
export function heureUtile(
  course: IDelivererLiveCourse | null | undefined,
  position: (PositionGps & { ts: string | null }) | null,
  restaurant: PositionGps | null,
  maintenant: Date,
): HeureUtile | null {
  if (!course) return null;
  if (course.statut === 'IN_DELIVERY') {
    if (course.en_retard && course.retard_min != null && course.retard_min > 0) {
      const duree = dureeLisible(course.retard_min);
      return { texte: `+${duree}`, retard: true, titre: `En retard de ${duree}`, instant: instant(course.fin_prevue) };
    }
    const fin = instant(course.fin_prevue);
    if (fin === null) return null;
    const h = heureCourte(new Date(fin));
    return { texte: h, retard: false, titre: `Fin vers ${h}`, instant: fin };
  }
  if (course.statut === 'ACCEPTED') {
    const { arrivee } = approcheLivreur({ position, restaurant, maintenant });
    if (!arrivee) return null;
    const h = heureCourte(arrivee);
    return { texte: h, retard: false, titre: `Arrivée vers ${h}`, instant: arrivee.getTime() };
  }
  return null;
}

function cleDeTri(
  section: CleSection,
  etat: EtatDisponibilite,
  l: IDelivererLive,
  rang: number | null,
  heure: HeureUtile | null,
): LivreurEnDirect['tri'] {
  const c = l.active_course;
  switch (section) {
    case 'EN_COURSE':
      // Fin la plus proche d'abord : tournées parties (retard compris), puis
      // ceux qui vont au restaurant, par heure d'arrivée.
      if (c?.statut === 'IN_DELIVERY') return { groupe: 0, valeur: instant(c.fin_prevue) };
      if (c?.statut === 'ACCEPTED') return { groupe: 1, valeur: heure?.instant ?? null };
      return { groupe: 2, valeur: null };
    case 'AU_RESTAURANT':
      // Celui qui attend depuis le plus longtemps d'abord.
      return { groupe: 0, valeur: instant(c?.at_restaurant_at) };
    case 'DISPONIBLES':
      // Ordre de la file, puis ceux qui ont une offre à lire, puis ceux en appel (ordre du serveur).
      return { groupe: rangEtat(etat), valeur: rang };
    case 'EN_PAUSE': {
      // Celui qui revient le plus tôt d'abord ; pause sans fin en dernier.
      const fin = etat === 'PAUSE_AUTO'
        ? (l.disponibilite?.auto_pause_until ?? l.auto_pause_until)
        : (l.disponibilite?.pause_until ?? l.pause_until);
      return { groupe: 0, valeur: estPauseSansFin(fin) ? null : instant(fin) };
    }
    default:
      return { groupe: rangEtat(etat), valeur: null };
  }
}

/**
 * État du livreur à l'instant, par la règle commune de `etatLivreur`
 * (« Injoignable » avec les applis fermées, un état inconnu « Hors
 * service ») ; rien de connu : « Hors service ».
 */
export function etatEnDirect(l: IDelivererLive, maintenant: Date): { etat: EtatDisponibilite; libelle: string } {
  const affiche = etatLivreurAffiche(l, maintenant);
  return { etat: affiche?.etat ?? 'HORS_SERVICE', libelle: affiche?.libelle ?? NOM_ETAT.HORS_SERVICE };
}

/** Une ligne de la liste « Livreurs » d'En direct. */
export function ligneEnDirect(l: IDelivererLive, ctx: ContexteEnDirect): LivreurEnDirect {
  const { maintenant } = ctx;
  const { etat, libelle } = etatEnDirect(l, maintenant);
  const section = sectionDuLivreur(etat, l.active_course);
  const rang = rangDuLivreur(l, ctx.unSeulRestaurant);
  const position = positionValable(l.location);
  const restaurant = coordonneesDuRestaurant(l, ctx);

  const positionDatee = position ? { ...position, ts: l.location_at } : null;
  const heure = section === 'EN_COURSE' ? heureUtile(l.active_course, positionDatee, restaurant, maintenant) : null;

  const avecCourse = section === 'EN_COURSE' || section === 'AU_RESTAURANT';
  const detail = joindre(
    ctx.unSeulRestaurant ? null : nomCourtRestaurant(l.restaurant?.name),
    detailDeSection(section, etat, l, rang, maintenant),
    avecCourse && !l.location_fresh ? 'position ancienne' : null,
  );

  return {
    id: l.id,
    live: l,
    nom: nomDuLivreur(l),
    etat,
    libelleEtat: libelle,
    section,
    rang,
    detail,
    heure,
    position,
    positionRecente: !!l.location_fresh && position !== null,
    tri: cleDeTri(section, etat, l, rang, heure),
  };
}

/** Groupe, puis valeur croissante (nulle en dernier), puis nom. */
export function comparerLignes(a: LivreurEnDirect, b: LivreurEnDirect): number {
  if (a.tri.groupe !== b.tri.groupe) return a.tri.groupe - b.tri.groupe;
  if (a.tri.valeur !== b.tri.valeur) {
    if (a.tri.valeur === null) return 1;
    if (b.tri.valeur === null) return -1;
    return a.tri.valeur - b.tri.valeur;
  }
  return a.nom.localeCompare(b.nom, 'fr');
}

export interface SectionEnDirect {
  cle: CleSection;
  titre: string;
  lignes: LivreurEnDirect[];
}

/** Sections non vides, dans l'ordre de la conception, lignes triées. */
export function groupesEnDirect(livreurs: readonly IDelivererLive[], ctx: ContexteEnDirect): SectionEnDirect[] {
  const parSection = new Map<CleSection, LivreurEnDirect[]>();
  for (const l of livreurs) {
    const ligne = ligneEnDirect(l, ctx);
    const liste = parSection.get(ligne.section) ?? [];
    liste.push(ligne);
    parSection.set(ligne.section, liste);
  }
  return ORDRE_SECTIONS.filter((cle) => (parSection.get(cle)?.length ?? 0) > 0).map((cle) => ({
    cle,
    titre: TITRES_SECTIONS[cle],
    lignes: [...parSection.get(cle)!].sort(comparerLignes),
  }));
}

/** Personne hors de « Hors service » : « Aucun livreur en service. » */
export function personneEnService(sections: readonly SectionEnDirect[]): boolean {
  return sections.every((s) => s.cle === 'HORS_SERVICE');
}

// ============================================================
// « À SURVEILLER »
// ============================================================

/** Nombre de lignes avant « Voir les 3 autres ». */
export const ALERTES_VISIBLES = 5;

/**
 * Alertes du restaurant choisi (toutes sur « Tous les restaurants »),
 * rouges d'abord, puis la plus ancienne ; sans heure de début en dernier.
 */
export function alertesEnDirect(
  signaux: readonly SignalLivraison[],
  restaurantId: string | null | undefined,
): SignalLivraison[] {
  const gardees = restaurantId ? signaux.filter((s) => s.restaurant_id === restaurantId) : [...signaux];
  return gardees
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const ga = a.s.gravite === 'rouge' ? 0 : 1;
      const gb = b.s.gravite === 'rouge' ? 0 : 1;
      if (ga !== gb) return ga - gb;
      const ta = instant(a.s.depuis);
      const tb = instant(b.s.depuis);
      if (ta !== tb) {
        if (ta === null) return 1;
        if (tb === null) return -1;
        return ta - tb;
      }
      return a.i - b.i;
    })
    .map(({ s }) => s);
}

/** « Voir l'autre », « Voir les 3 autres », « Réduire » ; null quand tout tient. */
export function libelleVoirPlus(total: number, ouvert: boolean, visibles = ALERTES_VISIBLES): string | null {
  const reste = total - visibles;
  if (reste <= 0) return null;
  if (ouvert) return 'Réduire';
  return reste === 1 ? "Voir l'autre" : `Voir les ${reste} autres`;
}

export type CibleSignal =
  | { type: 'livreur'; id: string }
  | { type: 'course'; id: string }
  | { type: 'fiche'; id: string };

/**
 * Ce que le toucher d'une alerte ouvre : le livreur qu'elle nomme, choisi
 * sur la carte et dans la liste s'il y est ; sinon la fiche de la course ;
 * sinon la fiche du livreur.
 */
export function cibleDuSignal(s: SignalLivraison, livreursPresents: ReadonlySet<string>): CibleSignal | null {
  if (s.livreur && livreursPresents.has(s.livreur.id)) return { type: 'livreur', id: s.livreur.id };
  if (s.course) return { type: 'course', id: s.course.id };
  if (s.livreur) return { type: 'fiche', id: s.livreur.id };
  return null;
}

// ============================================================
// FENÊTRE DU LIVREUR SUR LA CARTE
// ============================================================

/** « 1er », « 2e » ; null sans place. */
export function placeCourte(rang: number | null | undefined): string | null {
  if (!rang || rang < 1) return null;
  return rang === 1 ? '1er' : `${rang}e`;
}

/** « CRS-241024-0042 · Code 614 », ou la référence seule sans code. */
export function texteCourseCarte(c: Pick<IDelivererLiveCourse, 'reference' | 'pickup_code'>): string {
  const code = c.pickup_code?.trim();
  return code ? `${c.reference} · Code ${code}` : c.reference;
}

/** « Arrêt 1 · ORD-4818 · Livrée », un par arrêt, dans l'ordre de la tournée. */
export function textesArrets(livraisons: readonly IDelivererLiveDelivery[]): string[] {
  return [...livraisons]
    .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0))
    .map((d, i) => joindre(`Arrêt ${i + 1}`, d.order_reference, DELIVERY_STATUT_LABELS[d.statut] ?? null));
}

/** « Fin vers 13 h 05 », « En retard de 12 min » ; null sans fin prévue (serveur plus ancien, pas encore parti). */
export function texteFinTournee(
  c: Pick<IDelivererLiveCourse, 'statut' | 'fin_prevue' | 'en_retard' | 'retard_min'>,
): { texte: string; retard: boolean } | null {
  if (c.statut !== 'IN_DELIVERY') return null;
  if (c.en_retard && c.retard_min != null && c.retard_min > 0) {
    return { texte: `En retard de ${dureeLisible(c.retard_min)}`, retard: true };
  }
  const fin = instant(c.fin_prevue);
  return fin === null ? null : { texte: `Fin vers ${heureCourte(new Date(fin))}`, retard: false };
}

/** « Dernière position 12 h 40 », « Dernière position le 23/10 à 12 h 40 » ; null sans heure. */
export function texteDernierePosition(iso: string | null | undefined, maintenant: Date): string | null {
  const t = instant(iso);
  return t === null ? null : `Dernière position ${heureLisible(new Date(t), maintenant)}`;
}
