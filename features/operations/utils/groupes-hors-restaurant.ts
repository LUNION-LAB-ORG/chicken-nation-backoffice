/**
 * COLONNE « HORS RESTAURANT » GROUPÉE PAR LIVREUR (demande du 24/10 au soir :
 * « de la même manière que les commandes sont groupées au restaurant, elles
 * doivent être groupées hors restaurant pour avoir la traçabilité du livreur
 * qui traite les commandes »).
 *
 * Clé du groupe :
 *  1. livreur Chicken Nation : `livreur-{deliverer_id}`. Une commande livrée
 *     à encaisser d'une course finie rejoint le même livreur : c'est lui qui
 *     rapporte l'argent, peut-être déjà en route pour une autre course ;
 *  2. Turbo : `turbo-{turbo_courier_id}`, sinon `turbo-{turbo_courier_name}`,
 *     sinon `turbo-{course.id}` (sans course : `turbo-commande-{id}`) ;
 *  3. le reste (à emporter, sur place, sans livreur) : un seul groupe
 *     « Sans livreur », en dernier.
 *
 * En-tête : livreur, puis UNE chose à droite (retard, fin prévue, départ,
 * « Tout est livré », « Confiée à Turbo »), puis une ligne courte (restaurant
 * sur « Tous », « 1 sur 3 livrée », appli fermée, sac oublié, total à
 * encaisser). Une ligne par commande : arrêt et état, ou ce qu'il faut
 * encaisser.
 *
 * Serveur plus ancien, sans `course.tournee` : pas de compte « 1 sur 3 », ni
 * de retard ni de fin prévue ; l'en-tête dit « Parti à 12 h 45 » et chaque
 * ligne son arrêt.
 *
 * Fichier pur : testé par `bun test`.
 */

import { nomCourtRestaurant } from '../../restaurants/utils/nom-court';
import { OVERDUE_COLLECTED_UNPAID_MIN } from '../types/operations.types';
import { formatPrix } from './carte-commande';
import {
  appliDuLivreur,
  courseDeCommande,
  enumerer,
  heureCourte,
  livraisonDeCommande,
  lireTournee,
  partiSansRemise,
  positionConnue,
  positionRestaurant,
  referencesARemettre,
  texteRetard,
  texteTournee,
  type CommandeOperations,
  type CourseOperations,
  type TourneeOperations,
} from './suivi-course';
import { texteDuree } from './suivi-livraison';

// ============================================================
// TYPES
// ============================================================

/** Ce que la colonne lit d'une commande (sous-ensemble de `Order`). */
export interface CommandeHors extends CommandeOperations {
  type?: string | null;
  amount?: number | null;
  paied?: boolean | null;
  payment_method?: string | null;
  collected_at?: string | null;
  picked_up_at?: string | null;
  restaurant?: { name?: string | null; latitude?: number | null; longitude?: number | null } | null;
}

export type TonHors = 'gris' | 'vert' | 'bleu' | 'ambre' | 'rouge' | 'violet';

/** Un morceau de texte et sa couleur ; `titre` : texte de l'infobulle. */
export interface Morceau {
  texte: string;
  ton: TonHors;
  titre?: string;
}

export type IconeLigne = 'livree' | 'en_route' | 'chez_le_client' | 'a_livrer' | 'echec' | 'sans_livreur';

export interface Encaissement {
  montant: number;
  /** « Encaisser 8.000 F » (bouton, pour qui peut encaisser). */
  bouton: string;
  /** « À encaisser 8.000 F » (texte, pour les autres). */
  texte: string;
  /** Livrée depuis plus d'une heure sans être encaissée : rouge. */
  enRetard: boolean;
  /** « À encaisser depuis 1 h 05 ». */
  titre: string | null;
}

export interface LigneHors {
  commande: CommandeHors;
  reference: string;
  /** « Arrêt 2 · En route », « Arrêt 1 · Livrée 12 h 52 », « À récupérer ». */
  detail: Morceau;
  icone: IconeLigne;
  /** Livrée en espèces, pas encore encaissée. */
  encaisser: Encaissement | null;
  /** Livrée, paiement en ligne pas encore reçu : « Non payée ». */
  nonPayee: boolean;
}

/**
 * État dont l'avatar prend la couleur (`COULEURS_ETAT` des livreurs), ou
 * Turbo. `NEUTRE` : plus de course en cours (il ne reste que de l'argent à
 * rapporter), l'état du livreur n'est pas connu ici ; anneau gris clair, qui
 * n'est la couleur d'aucun état.
 */
export type EtatAvatar = 'EN_COURSE' | 'APPLI_FERMEE' | 'NEUTRE' | 'TURBO' | null;

export interface GroupeHors {
  cle: string;
  genre: 'livreur' | 'turbo' | 'sans_livreur';
  /** « Koffi Yao », « Turbo · Moussa », « Turbo », « Sans livreur ». */
  titre: string;
  /** Initiales de l'avatar (« KY »), vide pour Turbo et « Sans livreur ». */
  initiales: string;
  etatAvatar: EtatAvatar;
  /** Une seule chose à droite de l'en-tête. */
  droite: Morceau | null;
  /** Seconde ligne de l'en-tête, morceaux séparés par « · ». */
  ligne2: Morceau[];
  lignes: LigneHors[];
  /** Course en cours du livreur (la plus récente), null s'il ne reste que de l'argent. */
  course: CourseOperations | null;
  /** Tournée de cette course, si le serveur la donne. */
  tournee: TourneeOperations | null;
}

// ============================================================
// LECTURE
// ============================================================

const texte = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

const instant = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/** Statuts d'une course qui roule encore (le livreur n'a pas fini). */
const COURSE_VIVANTE = new Set(['PENDING_ASSIGNMENT', 'ACCEPTED', 'AT_RESTAURANT', 'IN_DELIVERY']);

/** Type de commande en mots (mêmes mots que `TYPE_LABEL`). */
const TYPE: Record<string, string> = { DELIVERY: 'À livrer', PICKUP: 'À récupérer', TABLE: 'À table' };

/** Livraison Turbo : service Turbo d'origine, ou course confiée à Turbo. */
function estTurbo(c: CommandeHors, course: CourseOperations | null): boolean {
  if (course?.deliverer_id) return false;
  return c.delivery_service === 'TURBO' || !!course?.turbo_escalated_at;
}

/** Clé du groupe d'une commande (voir l'en-tête du fichier). */
export function cleGroupe(c: CommandeHors): string {
  const course = courseDeCommande(c);
  if (course?.deliverer_id) return `livreur-${course.deliverer_id}`;
  if (estTurbo(c, course)) {
    const livraison = livraisonDeCommande(c);
    const id = texte(livraison?.turbo_courier_id);
    if (id) return `turbo-${id}`;
    const nom = texte(livraison?.turbo_courier_name);
    if (nom) return `turbo-${nom.toLowerCase()}`;
    return course ? `turbo-${course.id}` : `turbo-commande-${c.id}`;
  }
  return 'sans-livreur';
}

/** « KY » pour Koffi Yao, « K » sans nom de famille. */
export function initiales(livreur: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  const lettres = [livreur?.first_name, livreur?.last_name]
    .map((v) => texte(v)?.charAt(0).toUpperCase() ?? '')
    .join('');
  return lettres || '?';
}

/** « Koffi Yao », sinon le prénom ou le nom seul, sinon « Livreur ». */
function nomLivreur(livreur: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  return [texte(livreur?.first_name), texte(livreur?.last_name)].filter(Boolean).join(' ') || 'Livreur';
}

// ============================================================
// LIGNES
// ============================================================

/** « Arrêt 2 · » pour un rang lisible, sinon rien. */
const prefixeArret = (rang: unknown): string =>
  typeof rang === 'number' && Number.isInteger(rang) && rang > 0 ? `Arrêt ${rang} · ` : '';

/** Livrée en espèces, pas encore encaissée (et pour un emporté ou un sur place, dès qu'il est parti). */
function aEncaisser(c: CommandeHors): boolean {
  if (c.paied || c.payment_method !== 'OFFLINE') return false;
  if (c.status === 'COLLECTED') return true;
  return c.status === 'PICKED_UP' && c.type !== 'DELIVERY';
}

function encaissement(c: CommandeHors, maintenant: Date): Encaissement {
  const montant = typeof c.amount === 'number' && Number.isFinite(c.amount) ? c.amount : 0;
  const depuis = instant(c.collected_at ?? c.picked_up_at ?? null);
  const secondes = depuis !== null ? Math.max(0, (maintenant.getTime() - depuis) / 1000) : null;
  const enRetard = secondes !== null && secondes >= OVERDUE_COLLECTED_UNPAID_MIN * 60;
  const duree = secondes !== null ? texteDuree(secondes) : null;
  return {
    montant,
    bouton: `Encaisser ${formatPrix(montant)}`,
    texte: `À encaisser ${formatPrix(montant)}`,
    enRetard,
    titre: duree ? `À encaisser depuis ${duree}` : null,
  };
}

/** Ligne d'une commande d'un groupe. */
export function ligneHors(c: CommandeHors, sansLivreur: boolean, maintenant: Date): LigneHors {
  const livraison = livraisonDeCommande(c);
  const encaisser = aEncaisser(c) ? encaissement(c, maintenant) : null;
  const nonPayee = c.status === 'COLLECTED' && !c.paied && c.payment_method !== 'OFFLINE';
  const base = { commande: c, reference: c.reference, encaisser, nonPayee };

  if (sansLivreur || !livraison) {
    return { ...base, detail: { texte: TYPE[c.type ?? ''] ?? 'À livrer', ton: 'gris' }, icone: 'sans_livreur' };
  }

  const arret = prefixeArret(livraison.sequence_order);
  const livreeA = instant(livraison.delivered_at ?? (c.status === 'COLLECTED' ? c.collected_at ?? null : null));
  const livree = (): LigneHors => ({
    ...base,
    detail: { texte: `${arret}Livrée${livreeA !== null ? ` ${heureCourte(new Date(livreeA))}` : ''}`, ton: 'vert' },
    icone: 'livree',
  });

  if (c.status === 'COLLECTED') return livree();
  switch (livraison.statut) {
    case 'IN_ROUTE':
      return { ...base, detail: { texte: `${arret}En route`, ton: 'bleu' }, icone: 'en_route' };
    case 'ARRIVED':
      return { ...base, detail: { texte: `${arret}Chez le client`, ton: 'bleu' }, icone: 'chez_le_client' };
    case 'DELIVERED':
      return livree();
    case 'FAILED':
      return { ...base, detail: { texte: `${arret}Échec`, ton: 'rouge' }, icone: 'echec' };
    default:
      return { ...base, detail: { texte: `${arret}À livrer`, ton: 'gris' }, icone: 'a_livrer' };
  }
}

// ============================================================
// GROUPES
// ============================================================

/** La commande est encore en tournée (pas encore livrée). */
const enTournee = (c: CommandeHors): boolean => c.status === 'PICKED_UP' && c.type === 'DELIVERY';

/** Course en cours d'un groupe : celle des commandes encore en tournée, la plus récente. */
function courseEnCours(commandes: readonly CommandeHors[]): CourseOperations | null {
  let choisie: CourseOperations | null = null;
  let quand = Number.NEGATIVE_INFINITY;
  for (const c of commandes) {
    if (!enTournee(c)) continue;
    const course = courseDeCommande(c);
    if (!course) continue;
    const t = instant(course.picked_up_at ?? course.parti_at ?? course.created_at ?? null) ?? 0;
    if (!choisie || t > quand) {
      choisie = course;
      quand = t;
    }
  }
  return choisie;
}

interface Contexte {
  maintenant: Date;
  /** Toutes les commandes de l'écran : un sac resté au comptoir (« Parti sans ORD-4822 »). */
  toutes?: readonly CommandeOperations[];
  /** Compte du siège sur « Tous » : le restaurant en tête de la seconde ligne. */
  avecRestaurant?: boolean;
}

function construireGroupe(cle: string, commandes: CommandeHors[], ctx: Contexte): GroupeHors {
  const premiere = commandes[0];
  const premiereCourse = courseDeCommande(premiere);
  const genre: GroupeHors['genre'] = cle.startsWith('livreur-') ? 'livreur' : cle.startsWith('turbo-') ? 'turbo' : 'sans_livreur';
  const sansLivreur = genre === 'sans_livreur';
  const course = sansLivreur ? null : courseEnCours(commandes);
  const tournee = course ? lireTournee(course.tournee) : null;

  // Lignes : la tournée en cours par arrêt, puis l'argent à rapporter, le plus ancien d'abord.
  const lignes = commandes
    .map((c) => ligneHors(c, sansLivreur, ctx.maintenant))
    .sort((a, b) => {
      const ta = enTournee(a.commande) ? 0 : 1;
      const tb = enTournee(b.commande) ? 0 : 1;
      if (ta !== tb) return ta - tb;
      if (ta === 0) {
        const ra = livraisonDeCommande(a.commande)?.sequence_order ?? Number.MAX_SAFE_INTEGER;
        const rb = livraisonDeCommande(b.commande)?.sequence_order ?? Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
      }
      const da = instant(a.commande.collected_at ?? a.commande.picked_up_at ?? null) ?? 0;
      const db = instant(b.commande.collected_at ?? b.commande.picked_up_at ?? null) ?? 0;
      return da - db;
    });

  // Titre et avatar.
  let titre = 'Sans livreur';
  let noms = '';
  let etatAvatar: EtatAvatar = null;
  const appli = course ? appliDuLivreur(course, ctx.maintenant) : null;
  if (genre === 'livreur') {
    const livreur = (course ?? premiereCourse)?.deliverer ?? null;
    titre = nomLivreur(livreur);
    noms = initiales(livreur);
    etatAvatar = appli?.cas === 'FERMEE' ? 'APPLI_FERMEE' : course && COURSE_VIVANTE.has(course.statut) ? 'EN_COURSE' : 'NEUTRE';
  } else if (genre === 'turbo') {
    const nom = texte(livraisonDeCommande(premiere)?.turbo_courier_name);
    titre = nom ? `Turbo · ${nom}` : 'Turbo';
    etatAvatar = 'TURBO';
  }

  // Une seule chose à droite.
  const resteEnTournee = lignes.some((l) => enTournee(l.commande));
  let droite: Morceau | null = null;
  if (genre === 'turbo' && resteEnTournee) {
    droite = { texte: 'Confiée à Turbo', ton: 'violet' };
  } else if (!sansLivreur && !resteEnTournee) {
    droite = { texte: 'Tout est livré', ton: 'vert' };
  } else if (!sansLivreur && course) {
    const parti = instant(course.parti_at);
    if (tournee?.en_retard) droite = { texte: texteRetard(tournee.retard_min), ton: 'rouge' };
    else if (tournee?.fin_prevue) droite = { texte: `Fin vers ${heureCourte(new Date(tournee.fin_prevue))}`, ton: 'gris' };
    else if (parti !== null) droite = { texte: `Parti à ${heureCourte(new Date(parti))}`, ton: 'gris' };
  }

  // Seconde ligne.
  const ligne2: Morceau[] = [];
  // Nom court : « CHICKEN NATION ANGRÉ » coupait « 1 sur 3 livrée ».
  const restaurant = texte(nomCourtRestaurant(premiere.restaurant?.name));
  if (ctx.avecRestaurant && restaurant) ligne2.push({ texte: restaurant, ton: 'gris' });
  if (tournee && resteEnTournee) {
    const t = texteTournee(tournee.livrees, tournee.total);
    if (t) ligne2.push({ texte: t, ton: 'gris' });
  }
  if (appli?.cas === 'FERMEE') {
    ligne2.push({ texte: 'appli fermée', ton: 'gris', titre: [appli.libelle, appli.vue].filter(Boolean).join(' · ') });
  }
  if (course) {
    const restes = referencesARemettre(course.id, ctx.toutes ?? []);
    const restaurantPos = positionRestaurant(course.restaurant, ...commandes.map((c) => c.restaurant));
    if (restes.length > 0 && partiSansRemise(course, { maintenant: ctx.maintenant, position: positionConnue(course.deliverer), restaurant: restaurantPos })) {
      ligne2.push({ texte: `Parti sans ${enumerer(restes)}`, ton: 'rouge' });
    }
  }
  const aRapporter = lignes.filter((l) => l.encaisser);
  if (aRapporter.length >= 2) {
    const total = aRapporter.reduce((somme, l) => somme + (l.encaisser?.montant ?? 0), 0);
    ligne2.push({ texte: `À encaisser ${formatPrix(total)}`, ton: aRapporter.some((l) => l.encaisser?.enRetard) ? 'rouge' : 'ambre' });
  }

  return { cle, genre, titre, initiales: noms, etatAvatar, droite, ligne2, lignes, course, tournee };
}

/**
 * Rang d'un groupe dans la colonne : en retard (le plus en retard en tête),
 * puis par fin prévue, puis les tournées sans fin connue (départ le plus
 * ancien d'abord), puis ceux qui n'ont plus que de l'argent à rapporter, puis
 * « Sans livreur ».
 */
function rang(g: GroupeHors): [number, number] {
  if (g.genre === 'sans_livreur') return [4, 0];
  const enCours = g.lignes.some((l) => enTournee(l.commande));
  if (!enCours) return [3, 0];
  if (g.tournee?.en_retard) return [0, -(g.tournee.retard_min ?? 0)];
  const fin = instant(g.tournee?.fin_prevue ?? null);
  if (fin !== null) return [1, fin];
  return [2, instant(g.course?.parti_at ?? g.course?.picked_up_at ?? null) ?? 0];
}

/** Groupes de la colonne « Hors restaurant », dans l'ordre d'affichage. */
export function groupesHorsRestaurant(commandes: readonly CommandeHors[], ctx: Contexte): GroupeHors[] {
  const parCle = new Map<string, CommandeHors[]>();
  for (const c of commandes) {
    const cle = cleGroupe(c);
    const liste = parCle.get(cle);
    if (liste) liste.push(c);
    else parCle.set(cle, [c]);
  }
  const groupes = Array.from(parCle, ([cle, liste]) => construireGroupe(cle, liste, ctx));
  return groupes.sort((a, b) => {
    const [ra, sa] = rang(a);
    const [rb, sb] = rang(b);
    return ra !== rb ? ra - rb : sa - sb;
  });
}
