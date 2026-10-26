/**
 * LIVREURS « AUJOURD'HUI » (conception du 24/10, 10.2), règles pures testées
 * par `bun test`.
 *
 * Une ligne par livreur, par restaurant : état et son détail, planning du
 * jour, temps en ligne, courses de la journée. Données de
 * `GET /deliverers/live-locations?jour=true` (serveur, 11.5) ; un serveur
 * plus ancien n'a ni `rang_file`, ni le planning, ni le temps en ligne : les
 * cases restent vides, rien n'est inventé.
 *
 * Mots de la section 3.3 : « 1er de la file », « 1 sur 3 livrée »,
 * « jusqu'à 14 h 32 », « vue il y a 6 min », « Matin », « Soir », « Repos » ;
 * « depuis 4 min » pour une connexion coupée (25/10).
 */

import { dureeLisible } from '../../courses/utils/tableau-livraison';
import type { CreneauDuJour, IDelivererLive, IDelivererLiveCourse, ReponseCreneau } from '../types/deliverer-live.type';
import type { EtatDisponibilite } from '../types/livreur.types';
import { depuisLisible, estPauseSansFin, heureLisible, rangEtat, vueIlYa } from './disponibilite';

// ============================================================
// FILE
// ============================================================

/** « Rang FIFO #1 », « Rang FIFO #2 » (mots de la Carte live) ; null sans place. */
export function placeDansLaFile(rang: number | null | undefined): string | null {
  if (!rang || rang < 1) return null;
  return `Rang FIFO #${rang}`;
}

/**
 * Place dans la file : `rang_file` du serveur (file de SON restaurant). Un
 * serveur plus ancien n'a que `queue_rank`, qui range tous les livreurs lus
 * ensemble : juste quand un seul restaurant est lu, faux sur « Tous ».
 */
export function rangDuLivreur(
  l: Pick<IDelivererLive, 'queue_rank'> & { rang_file?: number | null },
  unSeulRestaurant: boolean,
): number | null {
  if (l.rang_file !== undefined) return l.rang_file;
  return unSeulRestaurant ? l.queue_rank : null;
}

// ============================================================
// DÉTAIL DE L'ÉTAT
// ============================================================

/** « 1 sur 3 livrée », « 2 sur 3 livrées », « Tout est livré » ; null sans livraison. */
export function avancementTournee(livraisons: IDelivererLiveCourse['deliveries']): string | null {
  const comptees = livraisons.filter((l) => l.statut !== 'CANCELLED');
  if (comptees.length === 0) return null;
  const livrees = comptees.filter((l) => l.statut === 'DELIVERED').length;
  if (livrees === comptees.length) return 'Tout est livré';
  return `${livrees} sur ${comptees.length} ${livrees > 1 ? 'livrées' : 'livrée'}`;
}

/** « jusqu'à 14 h 32 », « jusqu'au 23/10 à 14 h 32 » ; null pour une pause sans fin. */
export function jusquA(iso: string | null | undefined, maintenant: Date): string | null {
  if (!iso || estPauseSansFin(iso)) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const h = heureLisible(new Date(t), maintenant);
  return h.startsWith('le ') ? `jusqu'au ${h.slice(3)}` : `jusqu'à ${h}`;
}

export interface DetailEtat {
  /** « Rang FIFO #1 », « CRS-… · 1 sur 3 livrée », « jusqu'à 14 h 32 »… ; null : ligne vide. */
  texte: string | null;
  /** « +12 min » en rouge, tournée en retard. */
  retard: string | null;
  /** Le texte se lit en ambre (prévu mais pas en service). */
  ambre: boolean;
}

export interface EntreeDetail {
  course?: IDelivererLiveCourse | null;
  pause_until?: string | null;
  auto_pause_until?: string | null;
  appli_vue_a?: string | null;
  rang: number | null;
  /** Créneau où il est prévu sans être en service (alerte du serveur), sinon null. */
  prevuAuCreneau?: 'MORNING' | 'EVENING' | null;
}

const RIEN: DetailEtat = { texte: null, retard: null, ambre: false };

/** Ce que la ligne dit après la pastille d'état. */
export function detailEtatDuJour(etat: EtatDisponibilite, l: EntreeDetail, maintenant: Date): DetailEtat {
  switch (etat) {
    case 'DISPONIBLE':
      return { ...RIEN, texte: placeDansLaFile(l.rang) };
    case 'EN_COURSE': {
      const c = l.course;
      if (!c) return RIEN;
      let suite: string | null = null;
      if (c.statut === 'ACCEPTED') suite = 'en route vers le restaurant';
      else if (c.statut === 'AT_RESTAURANT') suite = 'au restaurant';
      else if (c.statut === 'IN_DELIVERY') suite = avancementTournee(c.deliveries);
      const retard = c.en_retard && c.retard_min != null && c.retard_min > 0 ? `+${dureeLisible(c.retard_min)}` : null;
      return { texte: suite ? `${c.reference} · ${suite}` : c.reference, retard, ambre: false };
    }
    case 'EN_PAUSE':
      return { ...RIEN, texte: jusquA(l.pause_until, maintenant) };
    case 'PAUSE_AUTO':
      return { ...RIEN, texte: jusquA(l.auto_pause_until, maintenant) };
    case 'APPLI_FERMEE':
    case 'INJOIGNABLE':
      return { ...RIEN, texte: vueIlYa(l.appli_vue_a, maintenant) };
    case 'CONNEXION_COUPEE':
      return { ...RIEN, texte: depuisLisible(l.appli_vue_a, maintenant) };
    case 'HORS_SERVICE':
    case 'INACTIF':
      if (!l.prevuAuCreneau) return RIEN;
      return {
        texte: l.prevuAuCreneau === 'MORNING' ? 'Prévu ce matin, pas en service' : 'Prévu ce soir, pas en service',
        retard: null,
        ambre: true,
      };
    default:
      return RIEN;
  }
}

// ============================================================
// PLANNING DU JOUR
// ============================================================

export interface MorceauPlanning {
  /** « Matin et soir », « Matin », « Soir », « Repos », « Hors planning », « Matin refusé ». */
  texte: string;
  /** Coche (confirmé), sablier (en attente), rouge (refusé) ; null : pas de marque. */
  reponse: Exclude<ReponseCreneau, null> | null;
}

/**
 * Case « Planning du jour ». Null sans la donnée (serveur plus ancien) : la
 * case reste vide.
 */
export function planningDuJour(c: CreneauDuJour | null | undefined): MorceauPlanning[] | null {
  if (!c) return null;
  if (c.repos) return [{ texte: 'Repos', reponse: null }];
  const { matin, soir } = c;
  if (!matin && !soir) return [{ texte: 'Hors planning', reponse: null }];
  if (matin && soir && matin === soir && matin !== 'REFUSED') return [{ texte: 'Matin et soir', reponse: matin }];
  const morceaux: MorceauPlanning[] = [];
  if (matin) morceaux.push({ texte: matin === 'REFUSED' ? 'Matin refusé' : 'Matin', reponse: matin });
  if (soir) morceaux.push({ texte: soir === 'REFUSED' ? 'Soir refusé' : 'Soir', reponse: soir });
  return morceaux;
}

/** « 3 h 12 », « 0 h 05 » ; vide si le serveur ne le sait pas. */
export function dureeEnLigne(secondes: number | null | undefined): string {
  if (secondes == null || !Number.isFinite(secondes)) return '';
  const minutes = Math.max(0, Math.floor(secondes / 60));
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

// ============================================================
// TRI ET REGROUPEMENT
// ============================================================

export interface CleDeTri {
  etat: EtatDisponibilite;
  rang: number | null;
  nom: string;
}

/** Par état (ceux qui peuvent partir d'abord), puis place dans la file, puis nom. */
export function comparerLivreursDuJour(a: CleDeTri, b: CleDeTri): number {
  const ecart = rangEtat(a.etat) - rangEtat(b.etat);
  if (ecart !== 0) return ecart;
  if (a.rang !== b.rang) {
    if (a.rang === null) return 1;
    if (b.rang === null) return -1;
    return a.rang - b.rang;
  }
  return a.nom.localeCompare(b.nom, 'fr');
}

/** En service : tout état sauf « Hors service » et « Inactif » (en appel, appli fermée, connexion coupée compris, comme le bandeau). */
export function estEnService(etat: EtatDisponibilite): boolean {
  return etat !== 'HORS_SERVICE' && etat !== 'INACTIF';
}

/** Hors service ou inactif, et pas attendu au créneau en cours : replié sous « Hors service ». */
export function estReplie(etat: EtatDisponibilite, prevuAuCreneau: string | null | undefined): boolean {
  return !estEnService(etat) && !prevuAuCreneau;
}

/** « Angré · 6 en service sur 8 · 7 prévus » (prévus seulement si un planning couvre la journée). */
export function enTeteRestaurant(nom: string, enService: number, total: number, prevus: number | null | undefined): string {
  const parties = [nom, `${enService} en service sur ${total}`];
  if (prevus != null) parties.push(`${prevus} ${prevus > 1 ? 'prévus' : 'prévu'}`);
  return parties.join(' · ');
}

// ============================================================
// RECHERCHE
// ============================================================

/** La vue n'a que le nom des livreurs (ni email ni téléphone) : le champ le dit. */
export const RECHERCHE_AUJOURDHUI = 'Rechercher par nom ou prénom';

const sansAccents = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Le nom contient la recherche, sans accents ni majuscules ; recherche vide : oui. */
export function correspondALaRecherche(nom: string, recherche: string): boolean {
  const filtre = sansAccents(recherche.trim());
  return !filtre || sansAccents(nom).includes(filtre);
}

/** Liste vide : recherche sans résultat, ou aucun livreur actif. */
export function messageAucunLivreur(p: { restaurantId: string | null; recherche: string }): string {
  if (p.recherche.trim()) return 'Aucun livreur ne correspond à la recherche.';
  return p.restaurantId ? 'Aucun livreur actif pour ce restaurant.' : 'Aucun livreur actif.';
}
