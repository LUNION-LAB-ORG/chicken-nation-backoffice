/**
 * SUIVI DES COURSES SUR L'ÉCRAN OPÉRATIONS (planificateur v2, demandes du 22/10).
 *
 * Le serveur crée la course dès qu'une commande est prête, y ajoute les
 * commandes de la même direction, la retient au comptoir pour une commande
 * encore en cuisine, fusionne deux courses sans livreur et ajoute une commande
 * à un livreur encore au restaurant après le retrait. Ce module traduit ces
 * champs en phrases courtes pour la caissière et le siège :
 *
 *  - livreur et son état : « En route, arrivée vers 12 h 38 », « Au comptoir »,
 *    « Parti à 12 h 45 » ;
 *  - retenue : « Attendre CMD-B, prête vers 12 h 41, départ au plus tard 12 h 44 » ;
 *  - ajout : « CMD-C ajoutée à la course de Koffi : remettre avec le code 123 » ;
 *  - fusion : « Courses CRS-A et CRS-B fusionnées : même trajet » ;
 *  - motif de regroupement : « Même trajet », « Même zone ».
 *
 * Champs lus (conception 3.13) : `Course.retenue_jusqua`,
 * `Course.commandes_attendues` [{ order_id, reference, prete_vers }],
 * `Course.parti_at`, `Course.motif_regroupement`, `Delivery.ajoutee_at`,
 * `Delivery.ajoutee_apres_retrait`. Tous facultatifs : un serveur plus ancien
 * ne les envoie pas, l'écran montre alors ce qu'il montrait avant.
 *
 * Champs de `GET /orders/operations/active` (serveur du 23/10) :
 * `course.deliverer.last_location` et `last_location_at`, `restaurant.latitude`
 * et `longitude` (heure d'arrivée du livreur), `course.offre_en_cours`
 * (« Proposée à Koffi »), `course.fenetre_ajout_ferme_a`. Un serveur plus
 * ancien ne les envoie pas : l'heure d'arrivée vient alors de la position en
 * direct du livreur (socket), l'offre reste « à un livreur » et la fenêtre
 * suit le réglage par défaut. `course.arrivee_estimee` est lue si elle arrive.
 *
 * Heures : celles d'Abidjan, c'est-à-dire UTC, comme le serveur.
 */

// ============================================================
// CONSTANTES (miroir des défauts du serveur)
// ============================================================

/** `course.vitesse_moyenne_kmh` : vitesse moyenne d'un livreur. */
export const VITESSE_MOYENNE_KMH = 22;
/** Approche sans Google : vol d'oiseau × 1,3 (conception 4.2, `FACTEUR_APPROCHE_LIVREUR`). */
export const FACTEUR_APPROCHE = 1.3;
/** `deliverer.au_restaurant_rayon_m` : à moins de 200 m, le livreur est au restaurant. */
export const AU_RESTAURANT_RAYON_M = 200;
/** `deliverer.au_restaurant_fraicheur_min` : un livreur immobile n'envoie plus rien, sa position reste vraie 15 min. */
export const AU_RESTAURANT_FRAICHEUR_MIN = 15;
/** `deliverer.gps_expiration_minutes` : au-delà, la position ne sert plus à estimer une arrivée. */
export const POSITION_FRAICHEUR_MIN = 5;
/**
 * `course.ajout_apres_retrait_max_s` : après la validation du retrait, le
 * livreur est réputé encore au comptoir pendant 4 min au plus si le serveur
 * n'a pas noté son départ (`parti_at`).
 */
export const FENETRE_APRES_RETRAIT_S = 240;

// ============================================================
// TYPES (forme des données de `GET /orders/operations/active`)
// ============================================================

export interface PositionGps {
  lat: number;
  lng: number;
}

/** Commande attendue par une retenue, telle qu'écrite dans `Course.commandes_attendues`. */
export interface CommandeAttendue {
  order_id: string;
  reference: string;
  /** Fin de préparation estimée (médiane), ISO. */
  prete_vers: string | null;
  /** Fin estimée prudente (8e décile), ISO. Facultatif. */
  prete_au_plus_tard: string | null;
}

export interface LivreurDeCourse {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  /** Dernière position (`operations/active`, serveur du 23/10). */
  last_location?: unknown;
  last_location_at?: string | null;
}

export interface CourseOperations {
  id: string;
  reference?: string | null;
  pickup_code?: string | null;
  statut: string;
  deliverer_id?: string | null;
  deliverer?: LivreurDeCourse | null;
  restaurant_id?: string | null;
  restaurant?: { latitude?: number | null; longitude?: number | null } | null;
  assigned_at?: string | null;
  at_restaurant_at?: string | null;
  picked_up_at?: string | null;
  offer_expires_at?: string | null;
  turbo_escalated_at?: string | null;
  created_at?: string | null;
  // Planificateur v2 (conception 3.13)
  retenue_jusqua?: string | null;
  commandes_attendues?: unknown;
  parti_at?: string | null;
  motif_regroupement?: string | null;
  /** Heure d'arrivée estimée du livreur au restaurant, si le serveur la donne. */
  arrivee_estimee?: string | null;
  /** Offre en attente : prénom du livreur sollicité et échéance (`operations/active`). */
  offre_en_cours?: { prenom?: string | null; expires_at?: string | null } | null;
  /** Fin de la fenêtre d'ajout après le retrait, livreur pas encore parti (`operations/active`). */
  fenetre_ajout_ferme_a?: string | null;
}

export interface LivraisonOperations {
  id?: string;
  statut?: string | null;
  ajoutee_at?: string | null;
  ajoutee_apres_retrait?: boolean | null;
  course?: CourseOperations | null;
}

/** Ce que le module lit d'une commande (sous-ensemble de `Order`). */
export interface CommandeOperations {
  id: string;
  reference: string;
  status: string;
  delivery_service?: string | null;
  restaurant?: { latitude?: number | null; longitude?: number | null } | null;
  delivery?: LivraisonOperations | null;
}

// ============================================================
// LECTURE DÉFENSIVE
// ============================================================

const instant = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/** Livraison de la commande (relation `delivery` de `operations/active`), ou null. */
export function livraisonDeCommande(commande: CommandeOperations): LivraisonOperations | null {
  const livraison = (commande as { delivery?: unknown }).delivery;
  return livraison && typeof livraison === 'object' ? (livraison as LivraisonOperations) : null;
}

/** Course de la commande, ou null (pas encore de course, Turbo d'origine sans course…). */
export function courseDeCommande(commande: CommandeOperations): CourseOperations | null {
  const course = livraisonDeCommande(commande)?.course;
  return course && typeof course === 'object' && typeof course.id === 'string' ? course : null;
}

/** Une position `{ lat, lng }` lisible, ou null (forme inattendue, 0,0 de HubRise). */
export function lirePosition(valeur: unknown): PositionGps | null {
  if (!valeur || typeof valeur !== 'object') return null;
  const v = valeur as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
  const lat = Number(v.lat ?? v.latitude);
  const lng = Number(v.lng ?? v.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

/**
 * Commandes attendues par la retenue (`Course.commandes_attendues`), sans
 * jamais planter : null, chaîne JSON, entrées incomplètes ou en double.
 */
export function lireCommandesAttendues(valeur: unknown): CommandeAttendue[] {
  let brut: unknown = valeur;
  if (typeof brut === 'string') {
    try {
      brut = JSON.parse(brut);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(brut)) return [];
  const vues = new Set<string>();
  const resultat: CommandeAttendue[] = [];
  for (const entree of brut) {
    if (!entree || typeof entree !== 'object') continue;
    const e = entree as Record<string, unknown>;
    const orderId = typeof e.order_id === 'string' ? e.order_id : '';
    const reference = typeof e.reference === 'string' ? e.reference.trim() : '';
    if (!orderId && !reference) continue;
    const cle = orderId || reference;
    if (vues.has(cle)) continue;
    vues.add(cle);
    resultat.push({
      order_id: orderId,
      reference: reference || 'une commande',
      prete_vers: typeof e.prete_vers === 'string' && instant(e.prete_vers) !== null ? e.prete_vers : null,
      prete_au_plus_tard:
        typeof e.prete_au_plus_tard === 'string' && instant(e.prete_au_plus_tard) !== null ? e.prete_au_plus_tard : null,
    });
  }
  return resultat;
}

// ============================================================
// TEXTES
// ============================================================

/** « 12 h 38 » (heure d'Abidjan = UTC), comme les textes du serveur. */
export function heureCourte(date: Date): string {
  return `${date.getUTCHours()} h ${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

/** « CMD-B », « CMD-B et CMD-C », « CMD-A, CMD-B et CMD-C ». */
export function enumerer(elements: readonly string[]): string {
  const liste = elements.filter(Boolean);
  if (liste.length <= 1) return liste[0] ?? '';
  return `${liste.slice(0, -1).join(', ')} et ${liste[liste.length - 1]}`;
}

/** Prénom affiché du livreur (« Koffi »), ou null s'il n'a ni prénom ni nom. */
export function prenomLivreur(livreur: LivreurDeCourse | null | undefined): string | null {
  if (!livreur) return null;
  const prenom = livreur.first_name?.trim();
  if (prenom) return prenom;
  const nom = livreur.last_name?.trim();
  return nom || null;
}

/** « de Koffi », « d'Ali », « d'Émile » : élision devant une voyelle ou un h. */
export function dePrenom(prenom: string): string {
  return /^[aeiouyhàâäéèêëîïôöùûü]/i.test(prenom) ? `d'${prenom}` : `de ${prenom}`;
}

/** « la course de Koffi », « la course d'Ali », ou « la course CRS-… » sans livreur nommé. */
export function nomDeCourse(course: CourseOperations): string {
  const prenom = course.deliverer_id || course.deliverer ? prenomLivreur(course.deliverer) : null;
  if (prenom) return `la course ${dePrenom(prenom)}`;
  return course.reference ? `la course ${course.reference}` : 'la course';
}

/**
 * Motifs de direction (conception 2.3) au cas où le serveur enverrait la
 * valeur d'énumération au lieu du libellé : jamais affichée brute.
 */
const MOTIFS_ENUMERES: Record<string, string> = {
  MEME_ADRESSE: 'même adresse',
  SUR_LE_TRAJET: 'même trajet',
  MEME_ZONE: 'même zone',
  DETOUR: 'petit détour',
  SANS_CARTE: 'même direction',
};

/**
 * Motif de regroupement en mots simples, minuscule en tête (pour une phrase) :
 * « sur le trajet » devient « même trajet », « même direction (sans carte) »
 * devient « même direction ». Rien d'affichable : null.
 */
export function motifRegroupement(motif: string | null | undefined): string | null {
  const brut = (motif ?? '').trim();
  if (!brut) return null;
  if (/^[A-Z][A-Z_]*$/.test(brut)) return MOTIFS_ENUMERES[brut] ?? null;
  const texte = brut.toLowerCase();
  if (texte === 'sur le trajet') return 'même trajet';
  if (texte.startsWith('même direction')) return 'même direction';
  // Motifs de refus : jamais le motif d'un regroupement effectif.
  if (texte === 'sens opposés' || texte === 'direction différente' || texte.includes('trop long')) return null;
  if (texte === 'adresse sans coordonnées') return null;
  return brut.charAt(0).toLowerCase() + brut.slice(1);
}

/** Même motif, majuscule en tête, pour une étiquette (« Même trajet »). */
export function etiquetteMotif(motif: string | null | undefined): string | null {
  const texte = motifRegroupement(motif);
  return texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : null;
}

// ============================================================
// ARRIVÉE DU LIVREUR
// ============================================================

/** Distance à vol d'oiseau en mètres. */
export function distanceMetres(a: PositionGps, b: PositionGps): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export interface PositionDatee extends PositionGps {
  /** ISO de la remontée. */
  ts: string | null;
}

export interface Approche {
  /** Le livreur est au restaurant (moins de 200 m, position de moins de 15 min). */
  auRestaurant: boolean;
  /** Heure d'arrivée estimée ; null si au restaurant ou inconnue. */
  arrivee: Date | null;
}

/**
 * Où en est le livreur qui vient au restaurant. Priorité à l'heure calculée
 * par le serveur (`arrivee_estimee`) ; sinon la position la plus récente
 * (socket en direct ou dernière position connue) : au restaurant à moins de
 * 200 m, sinon vol d'oiseau × 1,3 à 22 km/h, la règle du serveur sans Google.
 * Position trop ancienne ou restaurant sans coordonnées : rien n'est estimé.
 */
export function approcheLivreur(p: {
  arriveeServeur?: string | null;
  position: PositionDatee | null;
  restaurant: PositionGps | null;
  maintenant: Date;
}): Approche {
  const t = p.maintenant.getTime();
  const pos = p.position;
  const posAt = pos ? instant(pos.ts) : null;
  const ageMin = posAt === null ? null : (t - posAt) / 60_000;

  if (pos && p.restaurant && ageMin !== null && ageMin <= AU_RESTAURANT_FRAICHEUR_MIN) {
    if (distanceMetres(pos, p.restaurant) <= AU_RESTAURANT_RAYON_M) return { auRestaurant: true, arrivee: null };
  }

  const serveur = instant(p.arriveeServeur);
  if (serveur !== null) return { auRestaurant: false, arrivee: new Date(Math.max(serveur, t)) };

  if (!pos || !p.restaurant || posAt === null || ageMin === null || ageMin > POSITION_FRAICHEUR_MIN) {
    return { auRestaurant: false, arrivee: null };
  }
  const metres = distanceMetres(pos, p.restaurant) * FACTEUR_APPROCHE;
  const secondes = metres / ((VITESSE_MOYENNE_KMH * 1000) / 3600);
  return { auRestaurant: false, arrivee: new Date(Math.max(posAt + secondes * 1000, t)) };
}

/** Coordonnées du restaurant d'une course ou d'une commande, ou null. */
export function positionRestaurant(
  ...sources: ({ latitude?: number | null; longitude?: number | null } | null | undefined)[]
): PositionGps | null {
  for (const s of sources) {
    if (!s) continue;
    const pos = lirePosition({ lat: s.latitude, lng: s.longitude });
    if (pos) return pos;
  }
  return null;
}

/** Dernière position connue du livreur, telle que renvoyée par le serveur (si elle l'est). */
export function positionConnue(livreur: LivreurDeCourse | null | undefined): PositionDatee | null {
  const pos = lirePosition(livreur?.last_location);
  if (!pos) return null;
  return { ...pos, ts: livreur?.last_location_at ?? null };
}

/** La plus récente de deux positions datées. */
export function plusRecente(a: PositionDatee | null, b: PositionDatee | null): PositionDatee | null {
  if (!a) return b;
  if (!b) return a;
  return (instant(a.ts) ?? 0) >= (instant(b.ts) ?? 0) ? a : b;
}

// ============================================================
// ÉTAT DE LA COURSE ET DE SON LIVREUR
// ============================================================

export type EtatCourse =
  | 'RECHERCHE'
  | 'PROPOSEE'
  | 'TURBO'
  | 'EN_ROUTE'
  | 'AU_COMPTOIR'
  | 'PARTI'
  | 'EN_LIVRAISON'
  | 'TERMINEE'
  | 'ANNULEE'
  | 'SANS_LIVREUR';

export interface EtatAffiche {
  etat: EtatCourse;
  /** « En route, arrivée vers 12 h 38 », « Au comptoir », « Parti à 12 h 45 »… */
  libelle: string;
  /** Prénom du livreur, s'il y en a un. */
  livreur: string | null;
  /** Couleur de la pastille (vert = au comptoir, bleu = en route, ambre = recherche…). */
  ton: 'vert' | 'bleu' | 'ambre' | 'violet' | 'gris' | 'rouge';
}

/** Statuts de livraison qui disent que la tournée a commencé. */
const LIVRAISON_COMMENCEE = new Set(['IN_ROUTE', 'ARRIVED', 'DELIVERED', 'FAILED']);

/** Au moins une livraison de cette course a commencé (vu dans les commandes affichées). */
export function livraisonsCommencees(courseId: string, commandes: readonly CommandeOperations[]): boolean {
  return commandes.some((c) => {
    const l = livraisonDeCommande(c);
    return l?.course?.id === courseId && !!l.statut && LIVRAISON_COMMENCEE.has(l.statut);
  });
}

/**
 * État de la course vu du comptoir, avec le livreur :
 *  - sans livreur : « Recherche d'un livreur », « Proposée à un livreur,
 *    réponse avant 12 h 36 », « Confiée à Turbo » ;
 *  - acceptée : « En route, arrivée vers 12 h 38 » (ou « En route »), ou
 *    « Au comptoir » si sa position le dit déjà ;
 *  - au restaurant : « Au comptoir » ;
 *  - retrait validé : « Au comptoir » tant que le serveur n'a pas noté son
 *    départ et qu'aucune livraison n'a commencé (4 min au plus), puis
 *    « Parti à 12 h 45 », « Parti » ou « En livraison ».
 */
export function etatCourse(
  course: CourseOperations,
  ctx: {
    maintenant: Date;
    /** Position la plus récente du livreur (socket ou serveur). */
    position?: PositionDatee | null;
    /** Coordonnées du restaurant. */
    restaurant?: PositionGps | null;
    /** Une livraison de la course a commencé. */
    livraisonsCommencees?: boolean;
    /** Service de livraison de la commande (TURBO d'origine). */
    service?: string | null;
  },
): EtatAffiche {
  const t = ctx.maintenant.getTime();
  const livreur = course.deliverer_id || course.deliverer ? prenomLivreur(course.deliverer) : null;
  const statut = course.statut;

  if (statut === 'COMPLETED') return { etat: 'TERMINEE', libelle: 'Course terminée', livreur, ton: 'vert' };
  if (statut === 'CANCELLED') return { etat: 'ANNULEE', libelle: 'Course annulée', livreur, ton: 'rouge' };
  if (statut === 'EXPIRED') return { etat: 'SANS_LIVREUR', libelle: 'Aucun livreur trouvé', livreur, ton: 'rouge' };

  if (course.turbo_escalated_at || (ctx.service === 'TURBO' && !course.deliverer_id)) {
    return { etat: 'TURBO', libelle: 'Confiée à Turbo', livreur: null, ton: 'violet' };
  }

  if (statut === 'PENDING_ASSIGNMENT' || !course.deliverer_id) {
    const offre = course.offre_en_cours ?? null;
    const echeance = instant(offre?.expires_at ?? course.offer_expires_at);
    if (echeance !== null && echeance > t) {
      const prenom = offre?.prenom?.trim();
      return {
        etat: 'PROPOSEE',
        libelle: `Proposée à ${prenom || 'un livreur'}, réponse avant ${heureCourte(new Date(echeance))}`,
        livreur: null,
        ton: 'ambre',
      };
    }
    return { etat: 'RECHERCHE', libelle: "Recherche d'un livreur", livreur: null, ton: 'ambre' };
  }

  if (statut === 'ACCEPTED') {
    const approche = approcheLivreur({
      arriveeServeur: course.arrivee_estimee,
      position: ctx.position ?? null,
      restaurant: ctx.restaurant ?? null,
      maintenant: ctx.maintenant,
    });
    if (approche.auRestaurant) return { etat: 'AU_COMPTOIR', libelle: 'Au comptoir', livreur, ton: 'vert' };
    return {
      etat: 'EN_ROUTE',
      libelle: approche.arrivee ? `En route, arrivée vers ${heureCourte(approche.arrivee)}` : 'En route',
      livreur,
      ton: 'bleu',
    };
  }

  if (statut === 'AT_RESTAURANT') return { etat: 'AU_COMPTOIR', libelle: 'Au comptoir', livreur, ton: 'vert' };

  if (statut === 'IN_DELIVERY') {
    const parti = instant(course.parti_at);
    if (parti !== null) return { etat: 'PARTI', libelle: `Parti à ${heureCourte(new Date(parti))}`, livreur, ton: 'gris' };
    if (ctx.livraisonsCommencees) return { etat: 'EN_LIVRAISON', libelle: 'En livraison', livreur, ton: 'gris' };
    // Fin de la fenêtre donnée par le serveur ; sinon le réglage par défaut.
    const finServeur = instant(course.fenetre_ajout_ferme_a);
    const retrait = instant(course.picked_up_at);
    const fin = finServeur ?? (retrait !== null ? retrait + FENETRE_APRES_RETRAIT_S * 1000 : null);
    if (fin !== null && t < fin) {
      return { etat: 'AU_COMPTOIR', libelle: 'Au comptoir', livreur, ton: 'vert' };
    }
    return { etat: 'PARTI', libelle: 'Parti', livreur, ton: 'gris' };
  }

  return { etat: 'RECHERCHE', libelle: "Recherche d'un livreur", livreur, ton: 'ambre' };
}

// ============================================================
// RETENUE AU COMPTOIR
// ============================================================

/** Statuts d'une course qui peut être retenue (livreur affecté, pas parti). */
const STATUTS_RETENUE = new Set(['PENDING_ASSIGNMENT', 'ACCEPTED', 'AT_RESTAURANT', 'IN_DELIVERY']);

export interface Retenue {
  jusqua: Date;
  attendues: CommandeAttendue[];
}

/**
 * Retenue en cours : échéance future, au moins une commande attendue, course
 * pas partie. Levée (« tout est prêt ») ou échue : null.
 */
export function retenueEnCours(course: CourseOperations, maintenant: Date): Retenue | null {
  if (!STATUTS_RETENUE.has(course.statut) || course.parti_at || course.turbo_escalated_at) return null;
  const jusqua = instant(course.retenue_jusqua);
  if (jusqua === null || jusqua <= maintenant.getTime()) return null;
  const attendues = lireCommandesAttendues(course.commandes_attendues);
  if (attendues.length === 0) return null;
  return { jusqua: new Date(jusqua), attendues };
}

/**
 * « Attendre CMD-B, prête vers 12 h 41, départ au plus tard 12 h 44 » ;
 * plusieurs : « Attendre CMD-B (prête vers 12 h 41) et CMD-C (prête vers
 * 12 h 43), départ au plus tard 12 h 44 ». Pas de retenue : null.
 */
export function texteRetenue(course: CourseOperations, maintenant: Date): string | null {
  const retenue = retenueEnCours(course, maintenant);
  if (!retenue) return null;
  const depart = `départ au plus tard ${heureCourte(retenue.jusqua)}`;
  const prete = (a: CommandeAttendue) => (a.prete_vers ? `prête vers ${heureCourte(new Date(a.prete_vers))}` : null);
  if (retenue.attendues.length === 1) {
    const a = retenue.attendues[0];
    const vers = prete(a);
    return `Attendre ${a.reference}, ${vers ? `${vers}, ` : ''}${depart}`;
  }
  const liste = retenue.attendues.map((a) => {
    const vers = prete(a);
    return vers ? `${a.reference} (${vers})` : a.reference;
  });
  return `Attendre ${enumerer(liste)}, ${depart}`;
}

/**
 * Retenue levée parce que tout est prêt : le serveur garde l'heure
 * (`retenue_jusqua`) et vide `commandes_attendues`. Le livreur est au comptoir
 * ou en route, la caisse peut remettre : « Tout est prêt : remettre avec le
 * code 123 ».
 */
export function texteToutEstPret(course: CourseOperations): string | null {
  if (course.statut !== 'ACCEPTED' && course.statut !== 'AT_RESTAURANT') return null;
  if (!course.retenue_jusqua || course.turbo_escalated_at) return null;
  if (lireCommandesAttendues(course.commandes_attendues).length > 0) return null;
  return course.pickup_code ? `Tout est prêt : remettre avec le code ${course.pickup_code}` : 'Tout est prêt';
}

export interface Attente {
  courseId: string;
  /** « Attendue par la course de Koffi, départ au plus tard 12 h 44 ». */
  texte: string;
}

/**
 * Commandes encore en cuisine attendues par une course : identifiant de la
 * commande → texte pour sa carte. Lit toutes les courses présentes dans la
 * liste (une même course apparaît sur chacune de ses commandes).
 */
export function attentesParCommande(commandes: readonly CommandeOperations[], maintenant: Date): Map<string, Attente> {
  const resultat = new Map<string, Attente>();
  const vues = new Set<string>();
  for (const c of commandes) {
    const course = courseDeCommande(c);
    if (!course || vues.has(course.id)) continue;
    vues.add(course.id);
    const retenue = retenueEnCours(course, maintenant);
    if (!retenue) continue;
    for (const a of retenue.attendues) {
      if (!a.order_id || resultat.has(a.order_id)) continue;
      resultat.set(a.order_id, {
        courseId: course.id,
        texte: `Attendue par ${nomDeCourse(course)}, départ au plus tard ${heureCourte(retenue.jusqua)}`,
      });
    }
  }
  return resultat;
}

// ============================================================
// AJOUTS ET FUSIONS
// ============================================================

/** Statuts où une commande ajoutée doit être remise au livreur de la course. */
const STATUTS_AVEC_LIVREUR = new Set(['ACCEPTED', 'AT_RESTAURANT', 'IN_DELIVERY']);

/**
 * La commande a été ajoutée à une course qui avait DÉJÀ un livreur, et attend
 * d'être remise. Ajoutée avant l'acceptation (ajout ou fusion pendant la
 * recherche), elle fait partie de ce que le livreur a accepté : rien à dire.
 */
export function estAjouteeARemettre(commande: CommandeOperations): boolean {
  const livraison = livraisonDeCommande(commande);
  const course = livraison?.course;
  if (!livraison || !course || commande.status !== 'READY') return false;
  if (!course.deliverer_id || !STATUTS_AVEC_LIVREUR.has(course.statut) || course.parti_at) return false;
  if (livraison.ajoutee_apres_retrait) return true;
  const ajoutee = instant(livraison.ajoutee_at);
  const acceptee = instant(course.assigned_at);
  return ajoutee !== null && acceptee !== null && ajoutee > acceptee;
}

/**
 * « CMD-C ajoutée à la course de Koffi : remettre avec le code 123 » ;
 * plusieurs : « CMD-C et CMD-D ajoutées à … ». Sans référence (carte d'une
 * seule commande) : « Ajoutée à la course de Koffi : remettre avec le code 123 ».
 */
export function texteAjout(course: CourseOperations, references: readonly string[]): string {
  const code = course.pickup_code ? ` : remettre avec le code ${course.pickup_code}` : '';
  const refs = references.filter(Boolean);
  if (refs.length === 0) return `Ajoutée à ${nomDeCourse(course)}${code}`;
  const accord = refs.length > 1 ? 'ajoutées' : 'ajoutée';
  return `${enumerer(refs)} ${accord} à ${nomDeCourse(course)}${code}`;
}

/**
 * « Courses CRS-A et CRS-B fusionnées : même trajet ». La course absorbée
 * inconnue (page ouverte après coup) : « Une course fusionnée avec CRS-B ».
 */
export function texteFusion(references: readonly string[], motif: string | null | undefined): string {
  const refs = Array.from(new Set(references.filter(Boolean)));
  const raison = motifRegroupement(motif);
  const debut =
    refs.length >= 2
      ? `Courses ${enumerer(refs)} fusionnées`
      : refs.length === 1
        ? `Une course fusionnée avec ${refs[0]}`
        : 'Courses fusionnées';
  return raison ? `${debut} : ${raison}` : debut;
}

/** Où était chaque commande avant l'événement : identifiant → course (id et référence). */
export type CoursesAvant = Map<string, { courseId: string | null; reference: string | null }>;

/** Index des commandes déjà affichées (une ou plusieurs listes en cache). */
export function indexerCommandes(listes: readonly (readonly CommandeOperations[] | undefined | null)[]): CoursesAvant {
  const index: CoursesAvant = new Map();
  for (const liste of listes) {
    if (!Array.isArray(liste)) continue;
    for (const c of liste) {
      if (!c || typeof c.id !== 'string') continue;
      const course = courseDeCommande(c);
      index.set(c.id, { courseId: course?.id ?? null, reference: course?.reference ?? null });
    }
  }
  return index;
}

/** Course telle que portée par `course:statut:changed` (payload du serveur). */
export interface CourseEvenement extends CourseOperations {
  deliveries?: { order_id?: string | null; statut?: string | null; order?: { id?: string; reference?: string | null } | null }[];
}

export interface Avis {
  type: 'FUSION' | 'AJOUT';
  courseId: string;
  texte: string;
  /** Instant de réception (ms). */
  at: number;
}

/** Raisons de `course:statut:changed` posées par le planificateur v2. */
export const RAISON_FUSION = 'COURSES_FUSIONNEES';
export const RAISON_AJOUT = 'COMMANDE_AJOUTEE';

/**
 * Avis à montrer après `course:statut:changed` du planificateur :
 *  - fusion : références des courses absorbées données par le serveur
 *    (`fusion.absorbees`), complétées par les commandes qui étaient sur une
 *    autre course de la liste (ancien serveur) ;
 *  - ajout : les commandes qui n'étaient sur aucune course.
 * Rien si aucune commande de la course n'était affichée (autre restaurant).
 */
export function avisDeCourse(
  raison: string | null | undefined,
  course: CourseEvenement | null | undefined,
  avant: CoursesAvant,
  maintenant: Date,
  /** Références des courses absorbées, données par le serveur (`fusion.absorbees`). */
  absorbeesServeur: readonly string[] = [],
): Avis | null {
  if (!course || typeof course.id !== 'string') return null;
  if (raison !== RAISON_FUSION && raison !== RAISON_AJOUT) return null;
  const livraisons = (course.deliveries ?? []).filter((d) => d && d.statut !== 'CANCELLED');
  const connues = livraisons.filter((d) => {
    const id = d.order_id ?? d.order?.id;
    return !!id && avant.has(id);
  });
  if (connues.length === 0) return null;

  const absorbees: string[] = absorbeesServeur.filter((r) => typeof r === 'string' && r.length > 0);
  const ajoutees: string[] = [];
  for (const d of connues) {
    const id = (d.order_id ?? d.order?.id) as string;
    const precedente = avant.get(id)!;
    if (precedente.courseId === course.id) continue;
    if (precedente.courseId && precedente.reference) {
      if (!absorbees.includes(precedente.reference)) absorbees.push(precedente.reference);
    } else if (!precedente.courseId) {
      ajoutees.push(d.order?.reference ?? 'Une commande');
    }
  }

  if (raison === RAISON_FUSION || absorbees.length > 0) {
    const refs = [...absorbees, course.reference ?? ''].filter(Boolean);
    return { type: 'FUSION', courseId: course.id, texte: texteFusion(refs, course.motif_regroupement), at: maintenant.getTime() };
  }
  if (ajoutees.length === 0) return null;
  return { type: 'AJOUT', courseId: course.id, texte: texteAjout(course, ajoutees), at: maintenant.getTime() };
}

/** Un avis reste affiché sur la carte de la course pendant 10 minutes. */
export const DUREE_AVIS_MS = 10 * 60_000;

export function avisEncoreValides<T extends { at: number }>(avis: readonly T[], maintenant: Date): T[] {
  return avis.filter((a) => maintenant.getTime() - a.at < DUREE_AVIS_MS);
}
