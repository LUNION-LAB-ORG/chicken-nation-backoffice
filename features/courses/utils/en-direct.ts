/**
 * KANBAN « EN DIRECT » DE L'ÉCRAN COURSES (demande du 10/11), règles pures
 * testées par `bun test`.
 *
 * Quatre colonnes (retour du 10/11 : sans les terminées, trois étapes, Turbo
 * à part ; le serveur range chaque course), une carte par course :
 * code de retrait, restaurant, commandes, temps passé dans l'étape, alerte du
 * tableau de la livraison quand il y en a une (mêmes seuils et mêmes mots que
 * « À traiter »), et le livreur, qu'on change d'un menu avant le départ.
 */

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import type { DisponibiliteLivreur } from '../../livreurs/types/livreur.types';
import { peutRecevoirCommande } from '../../operations/utils/affectation-commande';
import type { ColonneEnDirect, CourseEnDirect, EtapeEnDirect } from '../types/en-direct.types';
import type { SignalLivraison } from '../types/tableau-livraison.types';
import { dureeLisible, minutesDepuis } from './tableau-livraison';
import { situationCourse } from './textes-signaux';

export interface DefColonne {
  cle: ColonneEnDirect;
  titre: string;
}

export const COLONNES: readonly DefColonne[] = [
  { cle: 'A_AFFECTER', titre: 'À affecter' },
  { cle: 'LIVREUR_AFFECTE', titre: 'Livreur affecté' },
  { cle: 'EN_LIVRAISON', titre: 'En livraison' },
  { cle: 'TURBO', titre: 'Turbo' },
];

/** Cartes par colonne, dans l'ordre du serveur. Colonne inconnue (serveur plus ancien) : laissée de côté. */
export function parColonne(courses: readonly CourseEnDirect[]): Record<ColonneEnDirect, CourseEnDirect[]> {
  const groupes: Record<ColonneEnDirect, CourseEnDirect[]> = {
    A_AFFECTER: [],
    LIVREUR_AFFECTE: [],
    EN_LIVRAISON: [],
    TURBO: [],
  };
  for (const c of courses) groupes[c.colonne]?.push(c);
  return groupes;
}

/** Sur téléphone : la colonne ouverte d'abord, la première qui demande d'agir. */
export function colonneParDefaut(groupes: Record<ColonneEnDirect, CourseEnDirect[]>): ColonneEnDirect {
  const ordre: ColonneEnDirect[] = ['A_AFFECTER', 'EN_LIVRAISON', 'LIVREUR_AFFECTE', 'TURBO'];
  return ordre.find((c) => groupes[c].length > 0) ?? 'A_AFFECTER';
}

/** Colonne voisine (glisser sur téléphone), sans sortir des quatre. */
export function colonneVoisine(cle: ColonneEnDirect, sens: 1 | -1): ColonneEnDirect {
  const i = COLONNES.findIndex((c) => c.cle === cle);
  const j = Math.min(COLONNES.length - 1, Math.max(0, i + sens));
  return COLONNES[j].cle;
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** « 2 commandes » ; en livraison « 1 sur 2 livrée ». */
export function texteCommandes(c: Pick<CourseEnDirect, 'etape' | 'commandes'>): string {
  const { total, livrees } = c.commandes;
  if (c.etape === 'EN_LIVRAISON') return `${livrees} sur ${total} ${livrees > 1 ? 'livrées' : 'livrée'}`;
  return pluriel(total, 'commande');
}

/** « 21 h 46 » ; null sans heure lisible. */
export function heureLisible(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Le temps de la carte, en toutes lettres (retour du 10/11 : « 45 min » seul
 * ne disait pas ce qu'il comptait) : « attend depuis 12 min », « en route
 * depuis 5 min », « au restaurant depuis 8 min », « parti à 21 h 46 » (mêmes
 * mots que la fiche d'une commande). Null sans heure.
 */
export function texteTemps(c: Pick<CourseEnDirect, 'etape' | 'depuis'>, maintenant: Date): string | null {
  if (c.etape === 'EN_LIVRAISON') {
    const h = heureLisible(c.depuis);
    return h ? `parti à ${h}` : null;
  }
  const min = minutesDepuis(c.depuis, maintenant);
  if (min === null) return null;
  const d = dureeLisible(min);
  if (c.etape === 'VERS_RESTAURANT') return `en route depuis ${d}`;
  if (c.etape === 'AU_RESTAURANT') return `au restaurant depuis ${d}`;
  return `attend depuis ${d}`;
}


const ETAPES_TURBO: Record<EtapeEnDirect, string> = {
  RECHERCHE: 'Turbo cherche un livreur',
  AUCUN_LIVREUR: "Turbo n'a trouvé personne",
  VERS_RESTAURANT: 'Livreur Turbo en route vers le restaurant',
  AU_RESTAURANT: 'Livreur Turbo au restaurant',
  EN_LIVRAISON: 'Livreur Turbo en livraison',
};

/** Étape d'une course Turbo, écrite sur sa carte (la colonne « Turbo » ne la dit pas). */
export function texteEtape(c: Pick<CourseEnDirect, 'colonne' | 'etape'>): string | null {
  return c.colonne === 'TURBO' ? (ETAPES_TURBO[c.etape] ?? null) : null;
}

/** « 1 commande · au restaurant depuis 8 min » : la seconde ligne de la carte. */
export function ligneDeLaCarte(c: Pick<CourseEnDirect, 'etape' | 'depuis' | 'commandes'>, maintenant: Date): string {
  return [texteCommandes(c), texteTemps(c, maintenant)].filter(Boolean).join(' · ');
}

export type BasculeFlotte = 'VERS_TURBO' | 'VERS_INTERNE';

/**
 * Badge « Turbo » qui agit (retour du 10/11) : tant que personne n'a pris la
 * course, on la confie à Turbo ou on la reprend pour nos livreurs, comme le
 * serveur (`/courses/:id/turbo`, `/courses/:id/interne` : course en
 * recherche seulement). Null : rien à basculer.
 */
export function basculeFlotte(c: Pick<CourseEnDirect, 'turbo' | 'etape'>): BasculeFlotte | null {
  if (c.etape !== 'RECHERCHE') return null;
  return c.turbo ? 'VERS_INTERNE' : 'VERS_TURBO';
}

export type TonCarte = 'rouge' | 'ambre';

/** Alerte du tableau de la livraison par course : la rouge d'abord (ordre du serveur). */
export function signauxParCourse(signaux: readonly SignalLivraison[] | null | undefined): Map<string, SignalLivraison> {
  const parCourse = new Map<string, SignalLivraison>();
  for (const s of signaux ?? []) {
    const id = s.course?.id;
    if (!id) continue;
    const deja = parCourse.get(id);
    if (!deja || (deja.gravite !== 'rouge' && s.gravite === 'rouge')) parCourse.set(id, s);
  }
  return parCourse;
}

/**
 * La ligne d'alerte d'une carte : celle du tableau de la livraison (mêmes
 * seuils et mots que « À traiter »), sinon ce que la carte sait seule (aucun
 * livreur trouvé, retard). Null : rien à signaler.
 */
export function alerteDeCarte(
  c: Pick<CourseEnDirect, 'id' | 'expiree' | 'retard_min' | 'etape'>,
  signaux: ReadonlyMap<string, SignalLivraison>,
): { ton: TonCarte; texte: string } | null {
  const s = signaux.get(c.id);
  if (s) return { ton: s.gravite, texte: situationCourse(s) };
  if (c.expiree) return { ton: 'rouge', texte: 'Aucun livreur trouvé' };
  if (c.etape === 'EN_LIVRAISON' && c.retard_min !== null && c.retard_min > 0) {
    return { ton: 'rouge', texte: `En retard de ${dureeLisible(c.retard_min)}` };
  }
  return null;
}

/** Fin d'une référence de commande, assez pour la reconnaître : « ORD-261110-50950 » → « …50950 ». */
export function finDeReference(reference: string): string {
  const fin = reference.split('-').pop()?.trim();
  return fin && fin !== reference ? `…${fin}` : reference;
}

/** « Koffi Kouassi », sinon « Livreur ». */
export function nomDuLivreur(l: CourseEnDirect['livreur']): string {
  const nom = [l?.prenom, l?.nom].filter((x) => !!x && x.trim()).join(' ').trim();
  return nom || 'Livreur';
}

/**
 * Livreur choisissable dans le menu « Livreur » d'une carte : libre (le
 * serveur refuse un livreur déjà en course) et joignable, comme pour
 * « Affecter à un livreur » sans course.
 */
export function peutPrendreCourse(d: DisponibiliteLivreur | null | undefined): boolean {
  if (!d) return true;
  if (d.en_course) return false;
  return peutRecevoirCommande(d);
}

/** Recherche du menu « Livreur » : nom ou téléphone, sans accents ni casse. */
export function correspondRecherche(
  l: { first_name?: string | null; last_name?: string | null; phone?: string | null },
  recherche: string,
): boolean {
  const plat = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  const q = plat(recherche);
  if (!q) return true;
  return plat(`${l.first_name ?? ''} ${l.last_name ?? ''} ${l.phone ?? ''}`).includes(q);
}
