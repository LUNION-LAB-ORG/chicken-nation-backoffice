/**
 * KANBAN « EN DIRECT » DE L'ÉCRAN COURSES (demande du 10/11), règles pures
 * testées par `bun test`.
 *
 * Cinq colonnes (le serveur range chaque course), une carte par course :
 * code de retrait, restaurant, commandes, temps passé dans l'étape, alerte du
 * tableau de la livraison quand il y en a une (mêmes seuils et mêmes mots que
 * « À traiter »), et le livreur, qu'on change d'un menu avant le départ.
 */

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import type { DisponibiliteLivreur } from '../../livreurs/types/livreur.types';
import { peutRecevoirCommande } from '../../operations/utils/affectation-commande';
import type { ColonneEnDirect, CourseEnDirect } from '../types/en-direct.types';
import type { SignalLivraison } from '../types/tableau-livraison.types';
import { dureeLisible, minutesDepuis } from './tableau-livraison';
import { situationCourse } from './textes-signaux';

export interface DefColonne {
  cle: ColonneEnDirect;
  titre: string;
}

export const COLONNES: readonly DefColonne[] = [
  { cle: 'A_AFFECTER', titre: 'À affecter' },
  { cle: 'VERS_RESTAURANT', titre: 'Vers le restaurant' },
  { cle: 'AU_RESTAURANT', titre: 'Au restaurant' },
  { cle: 'EN_LIVRAISON', titre: 'En livraison' },
  { cle: 'TERMINEE', titre: 'Terminées' },
];

/** Terminées montrées avant « Voir les autres » : la colonne reste courte. */
export const TERMINEES_VISIBLES = 5;

/** Cartes par colonne, dans l'ordre du serveur. */
export function parColonne(courses: readonly CourseEnDirect[]): Record<ColonneEnDirect, CourseEnDirect[]> {
  const groupes: Record<ColonneEnDirect, CourseEnDirect[]> = {
    A_AFFECTER: [],
    VERS_RESTAURANT: [],
    AU_RESTAURANT: [],
    EN_LIVRAISON: [],
    TERMINEE: [],
  };
  for (const c of courses) groupes[c.colonne]?.push(c);
  return groupes;
}

/** Nombre affiché en tête de colonne : les terminées de la journée en tout. */
export function nombreDeLaColonne(
  cle: ColonneEnDirect,
  groupes: Record<ColonneEnDirect, CourseEnDirect[]>,
  termineesTotal: number,
): number {
  return cle === 'TERMINEE' ? Math.max(termineesTotal, groupes.TERMINEE.length) : groupes[cle].length;
}

/** Sur téléphone : la colonne ouverte d'abord, la première qui demande d'agir. */
export function colonneParDefaut(groupes: Record<ColonneEnDirect, CourseEnDirect[]>): ColonneEnDirect {
  const ordre: ColonneEnDirect[] = ['A_AFFECTER', 'EN_LIVRAISON', 'AU_RESTAURANT', 'VERS_RESTAURANT', 'TERMINEE'];
  return ordre.find((c) => groupes[c].length > 0) ?? 'A_AFFECTER';
}

/** Colonne voisine (glisser sur téléphone), sans sortir des cinq. */
export function colonneVoisine(cle: ColonneEnDirect, sens: 1 | -1): ColonneEnDirect {
  const i = COLONNES.findIndex((c) => c.cle === cle);
  const j = Math.min(COLONNES.length - 1, Math.max(0, i + sens));
  return COLONNES[j].cle;
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** « 2 commandes » ; en livraison « 1 sur 2 livrées » ; terminée « 2 livrées ». */
export function texteCommandes(c: Pick<CourseEnDirect, 'colonne' | 'commandes'>): string {
  const { total, livrees } = c.commandes;
  if (c.colonne === 'EN_LIVRAISON') return `${livrees} sur ${total} ${livrees > 1 ? 'livrées' : 'livrée'}`;
  if (c.colonne === 'TERMINEE') return livrees > 1 ? `${livrees} livrées` : `${livrees} livrée`;
  return pluriel(total, 'commande');
}

/** « 20 h 53 » ; null sans heure lisible. */
export function heureLisible(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Temps dans l'étape (« 12 min », « 1 h 05 ») ; terminée : son heure de fin. */
export function tempsDeLaCarte(c: Pick<CourseEnDirect, 'colonne' | 'depuis'>, maintenant: Date): string | null {
  if (c.colonne === 'TERMINEE') return heureLisible(c.depuis);
  const min = minutesDepuis(c.depuis, maintenant);
  return min === null ? null : dureeLisible(min);
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
  c: Pick<CourseEnDirect, 'id' | 'expiree' | 'retard_min' | 'colonne'>,
  signaux: ReadonlyMap<string, SignalLivraison>,
): { ton: TonCarte; texte: string } | null {
  const s = signaux.get(c.id);
  if (s) return { ton: s.gravite, texte: situationCourse(s) };
  if (c.expiree) return { ton: 'rouge', texte: 'Aucun livreur trouvé' };
  if (c.colonne === 'EN_LIVRAISON' && c.retard_min !== null && c.retard_min > 0) {
    return { ton: 'rouge', texte: `En retard de ${dureeLisible(c.retard_min)}` };
  }
  return null;
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
