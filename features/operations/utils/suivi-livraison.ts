/**
 * SECTION « LIVRAISON » DU TIROIR D'UNE COMMANDE (demande du 24/10).
 *
 * Pour toute commande à livrer, le tiroir dit qui livre, où il en est et
 * combien de temps a pris chaque étape : course acceptée, arrivée au
 * restaurant (trajet du livreur vers le restaurant), commande récupérée
 * (attente au comptoir), départ de la course quand il diffère de la
 * récupération (plusieurs commandes), arrivée chez le client (trajet vers le
 * client), livrée.
 *
 * Données : `GET /orders/:id/livraison` (lecture seule, même cloisonnement
 * que le détail de la commande). Ce module ne fait que lire et mettre en
 * mots : aucune heure n'est inventée, une étape passée sans heure notée
 * s'affiche « non notée », une étape que le serveur ne suit pas (absente de
 * `etapes`) n'est pas montrée. Jamais de tiret à la place d'une valeur.
 *
 * Heures : celles d'Abidjan, c'est-à-dire UTC, comme le reste de l'écran
 * Opérations (`heureCourte`).
 *
 * Fichier pur : testé par `bun test`.
 */

import { heureCourte } from './suivi-course';

// ============================================================
// TYPES (forme de la réponse du serveur)
// ============================================================

export type ServiceLivraison = 'CHICKEN_NATION' | 'TURBO';

export type CleEtape = 'acceptee' | 'arrivee_restaurant' | 'recuperee' | 'depart' | 'arrivee_client' | 'livree';

export type EtatLivreur =
  | 'recherche'
  | 'proposee'
  | 'vers_restaurant'
  | 'au_comptoir'
  | 'vers_client'
  | 'livree'
  | 'annulee';

export interface EtapeLivraison {
  cle: CleEtape;
  /** Heure réelle (ISO), ou null tant que l'étape n'est pas passée ou si elle n'a pas été notée. */
  heure: string | null;
  /** Heure prévue (ISO) si le serveur la connaît déjà. */
  prevue: string | null;
}

export interface CourseDeLivraison {
  id: string;
  reference: string | null;
  code_retrait: string | null;
  nombre_commandes: number | null;
  /** Rang de cette commande dans la tournée (1 = premier arrêt). */
  rang_arret: number | null;
  statut: string | null;
}

export interface LivreurDeLivraison {
  id: string | null;
  nom: string | null;
  telephone: string | null;
  etat: EtatLivreur | null;
}

export interface DureesLivraison {
  vers_restaurant_s: number | null;
  attente_comptoir_s: number | null;
  vers_client_s: number | null;
  pret_a_livre_s: number | null;
}

export interface LivraisonCommande {
  service: ServiceLivraison | null;
  course: CourseDeLivraison | null;
  livreur: LivreurDeLivraison | null;
  etapes: EtapeLivraison[];
  durees: DureesLivraison;
}

// ============================================================
// LECTURE DÉFENSIVE
// ============================================================

/** Ordre de la frise, du haut vers le bas. */
export const ORDRE_ETAPES: readonly CleEtape[] = [
  'acceptee',
  'arrivee_restaurant',
  'recuperee',
  'depart',
  'arrivee_client',
  'livree',
];

const ETATS: ReadonlySet<string> = new Set([
  'recherche',
  'proposee',
  'vers_restaurant',
  'au_comptoir',
  'vers_client',
  'livree',
  'annulee',
]);

const objet = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const texte = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

const nombre = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** Une heure ISO lisible, ou null. */
const iso = (v: unknown): string | null => {
  const t = texte(v);
  return t && !Number.isNaN(Date.parse(t)) ? t : null;
};

/**
 * Réponse du serveur rendue sûre : champs absents, mal typés ou inconnus
 * deviennent null, étapes inconnues ou en double écartées. Rien d'exploitable
 * (pas un objet) : null, et la section ne s'affiche pas.
 */
export function lireLivraison(brut: unknown): LivraisonCommande | null {
  const r = objet(brut);
  if (!r) return null;

  const service = r.service === 'CHICKEN_NATION' || r.service === 'TURBO' ? r.service : null;

  const c = objet(r.course);
  const course: CourseDeLivraison | null =
    c && texte(c.id)
      ? {
          id: texte(c.id)!,
          reference: texte(c.reference),
          code_retrait: texte(c.code_retrait),
          nombre_commandes: nombre(c.nombre_commandes),
          rang_arret: nombre(c.rang_arret),
          statut: texte(c.statut),
        }
      : null;

  const l = objet(r.livreur);
  const etat = texte(l?.etat);
  const livreur: LivreurDeLivraison | null = l
    ? {
        id: texte(l.id),
        nom: texte(l.nom),
        telephone: texte(l.telephone),
        etat: etat && ETATS.has(etat) ? (etat as EtatLivreur) : null,
      }
    : null;

  const vues = new Set<string>();
  const etapes: EtapeLivraison[] = [];
  for (const e of Array.isArray(r.etapes) ? r.etapes : []) {
    const o = objet(e);
    const cle = texte(o?.cle);
    if (!o || !cle || !ORDRE_ETAPES.includes(cle as CleEtape) || vues.has(cle)) continue;
    vues.add(cle);
    etapes.push({ cle: cle as CleEtape, heure: iso(o.heure), prevue: iso(o.prevue) });
  }
  etapes.sort((a, b) => ORDRE_ETAPES.indexOf(a.cle) - ORDRE_ETAPES.indexOf(b.cle));

  const d = objet(r.durees);
  const duree = (v: unknown) => {
    const n = nombre(v);
    return n !== null && n >= 0 ? n : null;
  };
  const durees: DureesLivraison = {
    vers_restaurant_s: duree(d?.vers_restaurant_s),
    attente_comptoir_s: duree(d?.attente_comptoir_s),
    vers_client_s: duree(d?.vers_client_s),
    pret_a_livre_s: duree(d?.pret_a_livre_s),
  };

  return { service, course, livreur, etapes, durees };
}

// ============================================================
// TEXTES
// ============================================================

/** « 12 h 41 » (heure d'Abidjan = UTC) ; heure absente ou illisible : null. */
export function texteHeure(valeur: string | null | undefined): string | null {
  if (!valeur) return null;
  const t = Date.parse(valeur);
  return Number.isNaN(t) ? null : heureCourte(new Date(t));
}

/**
 * « 6 min », « 1 h », « 1 h 05 », « moins d'1 min » ; arrondi à la minute.
 * Durée absente ou négative : null.
 */
export function texteDuree(secondes: number | null | undefined): string | null {
  if (typeof secondes !== 'number' || !Number.isFinite(secondes) || secondes < 0) return null;
  const minutes = Math.round(secondes / 60);
  if (minutes < 1) return "moins d'1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** « Arrêt 2 sur 3 » pour une course de plusieurs commandes ; sinon null. */
export function texteArret(rang: number | null | undefined, total: number | null | undefined): string | null {
  if (typeof rang !== 'number' || typeof total !== 'number') return null;
  if (!Number.isInteger(rang) || !Number.isInteger(total) || total < 2 || rang < 1 || rang > total) return null;
  return `Arrêt ${rang} sur ${total}`;
}

/** « Chicken Nation », « Turbo » ; inconnu : null. */
export function libelleService(service: ServiceLivraison | null | undefined): string | null {
  if (service === 'CHICKEN_NATION') return 'Chicken Nation';
  if (service === 'TURBO') return 'Turbo';
  return null;
}

/** Libellé d'une étape de la frise. */
export const LIBELLES_ETAPES: Readonly<Record<CleEtape, string>> = {
  acceptee: 'Course acceptée',
  arrivee_restaurant: 'Arrivé au restaurant',
  recuperee: 'Commande récupérée',
  depart: 'Départ de la course',
  arrivee_client: 'Arrivé chez le client',
  livree: 'Livrée',
};

// ============================================================
// LIVREUR ET SON ÉTAT
// ============================================================

export type TonEtat = 'ambre' | 'bleu' | 'vert' | 'rouge';

export interface EtatAffiche {
  cle: EtatLivreur;
  libelle: string;
  ton: TonEtat;
}

/** Premier mot du nom (« Koffi » pour « Koffi Yao »). */
const prenom = (nom: string | null | undefined): string | null => texte(nom)?.split(/\s+/)[0] ?? null;

/**
 * État en une étiquette : « Recherche d'un livreur », « Proposée à Koffi »,
 * « En route vers le restaurant », « Au restaurant », « En route vers le
 * client », « Livrée », « Annulée ». Aucun état connu : null (jamais la
 * valeur brute).
 */
export function etatLivraison(livraison: LivraisonCommande): EtatAffiche | null {
  const cle = livraison.livreur?.etat ?? null;
  switch (cle) {
    case 'recherche':
      return { cle, libelle: "Recherche d'un livreur", ton: 'ambre' };
    case 'proposee': {
      const p = prenom(livraison.livreur?.nom);
      return { cle, libelle: `Proposée à ${p ?? 'un livreur'}`, ton: 'ambre' };
    }
    case 'vers_restaurant':
      return { cle, libelle: 'En route vers le restaurant', ton: 'bleu' };
    case 'au_comptoir':
      return { cle, libelle: 'Au restaurant', ton: 'vert' };
    case 'vers_client':
      return { cle, libelle: 'En route vers le client', ton: 'bleu' };
    case 'livree':
      return { cle, libelle: 'Livrée', ton: 'vert' };
    case 'annulee':
      return { cle, libelle: 'Annulée', ton: 'rouge' };
    default:
      return null;
  }
}

export interface LivreurAffiche {
  nom: string;
  /** Numéro tel qu'envoyé (masqué pour certains rôles). */
  telephone: string | null;
  /** Lien d'appel, seulement pour un numéro complet (jamais un numéro masqué). */
  lienAppel: string | null;
}

/** `tel:+2250102030405` pour un numéro complet ; masqué (« +225•••••••92 ») ou trop court : null. */
export function lienAppel(telephone: string | null | undefined): string | null {
  const t = texte(telephone);
  if (!t || !/^\+?[\d\s().-]+$/.test(t)) return null;
  const chiffres = t.replace(/\D/g, '');
  if (chiffres.length < 8) return null;
  return `tel:${t.startsWith('+') ? '+' : ''}${chiffres}`;
}

/**
 * Livreur à montrer : son nom et son téléphone. Personne tant que la course
 * cherche encore (recherche, offre en attente : l'étiquette d'état le dit)
 * ni sans livreur du tout (« Pas encore de livreur »). Livreur de Turbo dont
 * Turbo n'a pas donné le nom : « Livreur Turbo ».
 */
export function livreurAffiche(livraison: LivraisonCommande): LivreurAffiche | null {
  const l = livraison.livreur;
  if (!l || l.etat === 'recherche' || l.etat === 'proposee') return null;
  const nom = texte(l.nom) ?? (livraison.service === 'TURBO' ? 'Livreur Turbo' : null);
  if (!nom) return null;
  const telephone = texte(l.telephone);
  return { nom, telephone, lienAppel: lienAppel(telephone) };
}

/** Statuts d'une commande finie : sans course ni livreur, il n'y a rien à suivre. */
const COMMANDE_FINIE: ReadonlySet<string> = new Set(['COLLECTED', 'COMPLETED', 'CANCELLED']);

/**
 * La section a-t-elle quelque chose à dire ? Oui dès qu'il y a une course,
 * un livreur ou une étape. Sans rien de tout cela : « Pas encore de livreur »
 * pour une commande en cours, mais rien pour une commande finie ou une
 * ancienne commande sans service de livraison (ce serait faux).
 */
export function sectionAAfficher(
  livraison: LivraisonCommande | null | undefined,
  statutCommande?: string | null,
): livraison is LivraisonCommande {
  if (!livraison) return false;
  if (livraison.course || livraison.livreur || livraison.etapes.length > 0) return true;
  if (!livraison.service) return false;
  return !COMMANDE_FINIE.has(statutCommande ?? '');
}

// ============================================================
// FRISE
// ============================================================

export type StatutLigne = 'faite' | 'en_cours' | 'a_venir';

export interface LigneFrise {
  cle: CleEtape;
  libelle: string;
  /** « 12 h 41 » ; étape passée sans heure notée (« non notée ») ou à venir sans prévision : null. */
  heure: string | null;
  /** « vers 12 h 55 » pour une étape pas encore passée, si le serveur la prévoit. */
  prevue: string | null;
  /** Durée qui mène à cette étape : « 6 min de trajet », « 4 min au restaurant ». */
  duree: string | null;
  statut: StatutLigne;
}

/** Écart minimal pour montrer un départ distinct de la récupération (60 s). */
const DEPART_DISTINCT_MS = 60_000;

/**
 * La livraison est finie (livrée ou annulée) : plus besoin de la relire.
 * Réponse absente (route inconnue, 404) : finie aussi, rien à relire.
 */
export function livraisonTerminee(livraison: LivraisonCommande | null | undefined): boolean {
  if (!livraison) return true;
  const etat = livraison.livreur?.etat;
  if (etat === 'livree' || etat === 'annulee') return true;
  const statut = livraison.course?.statut;
  if (statut === 'CANCELLED' || statut === 'EXPIRED') return true;
  return !!livraison.etapes.find((e) => e.cle === 'livree')?.heure;
}

const annulee = (livraison: LivraisonCommande): boolean =>
  livraison.livreur?.etat === 'annulee' ||
  livraison.course?.statut === 'CANCELLED' ||
  livraison.course?.statut === 'EXPIRED';

/**
 * Le départ de la course est-il une étape à part ? Oui s'il a été noté plus
 * d'une minute après la récupération (le livreur a attendu une autre
 * commande), ou, pas encore noté, quand le serveur le prévoit (fin de la
 * retenue ou de la fenêtre d'ajout) ou que la course compte plusieurs
 * commandes, tant que le livreur n'est pas chez le client. Sinon il se
 * confond avec la récupération et n'est pas montré. Le serveur applique la
 * même règle : ceci n'est qu'une garde.
 */
function departAMontrer(livraison: LivraisonCommande, etapes: ReadonlyMap<CleEtape, EtapeLivraison>): boolean {
  const depart = etapes.get('depart');
  if (!depart) return false;
  const recuperee = etapes.get('recuperee');
  if (depart.heure) {
    if (!recuperee?.heure) return true;
    return Date.parse(depart.heure) - Date.parse(recuperee.heure) >= DEPART_DISTINCT_MS;
  }
  const attendu = !!depart.prevue || (livraison.course?.nombre_commandes ?? 0) > 1;
  const plusLoin = !!etapes.get('arrivee_client')?.heure || !!etapes.get('livree')?.heure;
  return attendu && !plusLoin && !annulee(livraison);
}

/**
 * Lignes de la frise, du haut vers le bas, avec leur heure et la durée qui
 * mène à chacune :
 *  - arrivée au restaurant : trajet du livreur vers le restaurant ;
 *  - commande récupérée : attente au comptoir ;
 *  - arrivée chez le client (ou livrée, si l'arrivée n'est pas suivie) :
 *    trajet vers le client.
 * Une étape passée (heure notée, ou une étape plus bas l'est) est « faite » ;
 * la première qui ne l'est pas est « en cours », sauf livraison finie ; les
 * suivantes sont « à venir », avec l'heure prévue si le serveur la donne.
 */
export function lignesFrise(livraison: LivraisonCommande): LigneFrise[] {
  const parCle = new Map(livraison.etapes.map((e) => [e.cle, e] as const));
  const montrees = ORDRE_ETAPES.filter((cle) => parCle.has(cle) && (cle !== 'depart' || departAMontrer(livraison, parCle)));

  const duree = (cle: CleEtape): string | null => {
    const d = livraison.durees;
    const avec = (s: number | null, suffixe: string) => {
      const t = texteDuree(s);
      return t ? `${t} ${suffixe}` : null;
    };
    if (cle === 'arrivee_restaurant') return avec(d.vers_restaurant_s, 'de trajet');
    if (cle === 'recuperee') return avec(d.attente_comptoir_s, 'au restaurant');
    if (cle === 'arrivee_client') return avec(d.vers_client_s, 'de trajet');
    if (cle === 'livree' && !montrees.includes('arrivee_client')) return avec(d.vers_client_s, 'de trajet');
    return null;
  };

  // Dernière étape passée : tout ce qui est au-dessus l'est aussi.
  let derniere = -1;
  montrees.forEach((cle, i) => {
    if (parCle.get(cle)?.heure) derniere = i;
  });
  const finie = livraisonTerminee(livraison);

  return montrees.map((cle, i) => {
    const e = parCle.get(cle)!;
    const faite = i <= derniere;
    const statut: StatutLigne = faite ? 'faite' : i === derniere + 1 && !finie ? 'en_cours' : 'a_venir';
    const prevue = !faite ? texteHeure(e.prevue) : null;
    return {
      cle,
      libelle: LIBELLES_ETAPES[cle],
      heure: texteHeure(e.heure),
      prevue: prevue ? `vers ${prevue}` : null,
      duree: faite ? duree(cle) : null,
      statut,
    };
  });
}

/** « Prête → livrée : 28 min » quand la commande est livrée et la durée connue ; sinon null. */
export function texteTotal(livraison: LivraisonCommande): string | null {
  if (!livraison.etapes.find((e) => e.cle === 'livree')?.heure) return null;
  const d = texteDuree(livraison.durees.pret_a_livre_s);
  return d ? `Prête → livrée : ${d}` : null;
}
