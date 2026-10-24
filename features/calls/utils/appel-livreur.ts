/**
 * Appels avec un livreur (demande du 24/10, serveur au commit e00a1bd).
 *
 *  - Le livreur appelle le service client depuis son appli : la sonnerie du
 *    centre d'appels montre qui appelle (nom, téléphone, restaurant) et la
 *    course dont il parle, pour répondre sans chercher.
 *  - Le service client (ou l'admin) appelle un livreur depuis sa fiche, la
 *    liste des livreurs ou la section « Livraison » du tiroir de commande :
 *    `POST /calls` avec `{ targetKind: "DELIVERER", deliverer_id }`.
 *  - L'historique nomme le livreur au lieu de « Appelant ».
 *
 * Fonctions pures, sans React : testées par `bun test`.
 */

import { UserRole } from "../../users/types/user.types";
import type { CallTargetKind, IAppelantLivreur, ICall, IIncomingCallEvent } from "../types/call.type";

/** Nature de la cible et type de l'appelant quand c'est un livreur. */
export const LIVREUR = "DELIVERER";

/** Codes des refus du serveur (champ `code` du corps d'erreur). */
export const CODES_APPEL_LIVREUR = {
  DESACTIVES: "APPELS_LIVREURS_DESACTIVES",
  EN_COURS: "APPEL_EN_COURS",
  INDISPONIBLES: "APPELS_INDISPONIBLES",
} as const;

const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** « Koffi Kouassi » depuis prénom et nom ; sinon le téléphone ; sinon null. */
export function nomLivreur(
  l: { first_name?: unknown; last_name?: unknown; phone?: unknown } | null | undefined,
): string | null {
  if (!l) return null;
  const nom = [texte(l.first_name), texte(l.last_name)].filter(Boolean).join(" ");
  return nom || texte(l.phone);
}

// ============================================================
// SONNERIE : APPEL VENANT D'UN LIVREUR
// ============================================================

export interface AppelantLivreur {
  id: string | null;
  nom: string;
  telephone: string | null;
  restaurant: string | null;
  /** Référence de la course dont il parle, null sans course. */
  courseReference: string | null;
}

/** L'appel vient-il d'un livreur ? */
export function estAppelLivreur(e: Pick<IIncomingCallEvent, "callerType"> | null | undefined): boolean {
  return e?.callerType === LIVREUR;
}

/**
 * Qui appelle, quand c'est un livreur : le champ `livreur` de `call:incoming`
 * (et de chaque entrée de `GET /calls/ringing`). Pas un livreur : null.
 */
export function lireAppelantLivreur(e: IIncomingCallEvent | null | undefined): AppelantLivreur | null {
  if (!e || !estAppelLivreur(e)) return null;
  const l = e.livreur;
  return {
    id: texte(l?.id) ?? texte(e.callerId),
    nom: texte(l?.nom) ?? texte(e.callerName) ?? "Livreur",
    telephone: texte(l?.telephone),
    restaurant: texte(l?.restaurant),
    courseReference: texte(l?.course_reference),
  };
}

/**
 * Numéro de Côte d'Ivoire lisible : « +2250701020304 » devient
 * « +225 07 01 02 03 04 ». Autre forme : tel quel.
 */
export function telephoneLisible(telephone: string | null | undefined): string | null {
  const t = texte(telephone);
  if (!t) return null;
  const m = /^(?:\+|00)?225\s*((?:\d\s*){10})$/.exec(t);
  if (!m) return t;
  const chiffres = m[1].replace(/\s/g, "");
  return `+225 ${chiffres.match(/\d{2}/g)!.join(" ")}`;
}

/** « Livreur · Angré », ou « Livreur » sans restaurant. */
export function sousTitreLivreur(restaurant: string | null | undefined): string {
  const r = texte(restaurant);
  return r ? `Livreur · ${r}` : "Livreur";
}

/** « Course CRS-A1 », ou null sans course (rien à afficher). */
export function texteCourse(reference: string | null | undefined): string | null {
  const r = texte(reference);
  return r ? `Course ${r}` : null;
}

/** Ce que montre la sonnerie sous le nom du livreur, ligne par ligne. */
export function lignesSonnerieLivreur(a: AppelantLivreur): {
  sousTitre: string;
  telephone: string | null;
  course: string | null;
} {
  return {
    sousTitre: sousTitreLivreur(a.restaurant),
    telephone: telephoneLisible(a.telephone),
    course: texteCourse(a.courseReference),
  };
}

/** « Livreur · Angré · Course CRS-A1 » : restaurant et course s'ils sont connus. */
export function detailLivreur(
  restaurant: string | null | undefined,
  courseReference: string | null | undefined,
): string {
  const course = texteCourse(courseReference);
  return course ? `${sousTitreLivreur(restaurant)} · ${course}` : sousTitreLivreur(restaurant);
}

/** Une ligne pour la notification du navigateur et le panneau d'appel. */
export function detailAppelLivreur(a: AppelantLivreur): string {
  return detailLivreur(a.restaurant, a.courseReference);
}

/** La même ligne depuis le champ `livreur` du serveur (`POST /calls`, `GET /calls/active`). */
export function detailDepuisServeur(l: IAppelantLivreur | null | undefined): string | null {
  return l ? detailLivreur(l.restaurant, l.course_reference) : null;
}

// ============================================================
// APPELER UN LIVREUR
// ============================================================

/** Rôles que le serveur autorise à appeler un livreur : l'admin et le service client. */
const ROLES_APPEL_LIVREUR: ReadonlySet<string> = new Set([UserRole.ADMIN, UserRole.CALL_CENTER]);

/**
 * Le bouton « Appeler » s'affiche-t-il ? Il faut un rôle que le serveur
 * autorise ET le droit de lire les appels (module `calls`). LIVRAISON_OPS,
 * le marketing ou un restaurant ne le voient pas.
 */
export function peutAppelerLivreur(role: string | null | undefined, droitAppels: boolean): boolean {
  return droitAppels && !!role && ROLES_APPEL_LIVREUR.has(role);
}

/** Le serveur n'appelle qu'un livreur actif (sinon « Livreur introuvable »). */
export function livreurAppelable(entityStatus: string | null | undefined): boolean {
  return entityStatus === "ACTIVE";
}

/** « Appeler Koffi Kouassi » : titre et libellé lu du bouton. */
export function titreBoutonAppel(nom: string | null | undefined): string {
  return `Appeler ${texte(nom) ?? "le livreur"}`;
}

/**
 * Livreur à appeler depuis la section « Livraison » du tiroir : seulement un
 * livreur Chicken Nation (un livreur Turbo n'a pas notre appli), connu par
 * son identifiant et déjà sur la commande (pas pendant la recherche ni
 * pendant une offre).
 */
export function livreurAAppeler(livraison: {
  service: string | null;
  livreur: { id: string | null; nom: string | null; etat: string | null } | null;
} | null | undefined): { delivererId: string; nom: string } | null {
  const l = livraison?.livreur;
  if (!l || livraison?.service !== "CHICKEN_NATION") return null;
  if (l.etat === "recherche" || l.etat === "proposee") return null;
  const id = texte(l.id);
  if (!id) return null;
  return { delivererId: id, nom: texte(l.nom) ?? "Livreur" };
}

/**
 * Message quand personne n'a l'appli ouverte au moment de l'appel
 * (`online: 0` dans la réponse de `POST /calls`). Le livreur reçoit quand
 * même une notification.
 */
export function texteSansConnexion(targetKind: CallTargetKind | null | undefined, nom: string): string {
  if (targetKind === LIVREUR) {
    return `${texte(nom) ?? "Le livreur"} n'a pas l'appli ouverte, il reçoit une notification.`;
  }
  return "Personne n'est connecté pour l'instant, ça sonne quand même.";
}

/**
 * Refus de `POST /calls` vers un livreur, en une phrase courte. L'erreur est
 * celle de `apiRequest` : `status`, et `code` quand le serveur en donne un.
 */
export function texteErreurAppelLivreur(erreur: unknown): string {
  const e = (erreur && typeof erreur === "object" ? erreur : {}) as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };
  const status = typeof e.status === "number" ? e.status : null;
  const code = texte(e.code);
  if (code === CODES_APPEL_LIVREUR.DESACTIVES) return "Les appels avec les livreurs sont coupés.";
  if (code === CODES_APPEL_LIVREUR.EN_COURS || status === 409) return "Ce livreur est déjà en appel.";
  if (code === CODES_APPEL_LIVREUR.INDISPONIBLES || (status !== null && status >= 500)) {
    return "Service d'appel indisponible, réessayez dans un instant.";
  }
  if (status === 404) return "Livreur introuvable.";
  if (status === 403) return "Votre profil ne peut pas appeler un livreur.";
  const message = texte(e.message);
  if (status === null && message?.startsWith("Session expirée")) return message;
  return "Impossible d'appeler le livreur.";
}

/**
 * Fin d'un appel vers un livreur avant qu'il décroche (`call:ended`) : il a
 * refusé, ou n'a pas répondu en 45 s. Autre raison : rien à dire.
 */
export function texteFinAppelLivreur(raison: string | null | undefined, nom: string): string | null {
  const qui = texte(nom) ?? "Le livreur";
  if (raison === "rejected") return `${qui} n'est pas disponible`;
  if (raison === "no-answer") return `${qui} n'a pas répondu`;
  return null;
}

// ============================================================
// HISTORIQUE
// ============================================================

export interface LivreurDeLAppel {
  id: string | null;
  nom: string;
  restaurant: string | null;
  /** Référence de la course dont parlait l'appel. */
  courseReference: string | null;
  /** Le livreur a appelé (entrant) ou a été appelé (sortant). */
  sens: "entrant" | "sortant";
}

/**
 * Livreur d'un appel de l'historique : l'appelant (`caller_deliverer`) ou la
 * cible (`target_deliverer`). Appel sans livreur : null.
 */
export function livreurDeLAppel(call: ICall): LivreurDeLAppel | null {
  const entrant = call.caller_type === LIVREUR || !!call.caller_deliverer_id || !!call.caller_deliverer;
  const sortant = call.target_kind === LIVREUR;
  if (!entrant && !sortant) return null;
  const d = entrant ? call.caller_deliverer : call.target_deliverer;
  return {
    id: texte(d?.id) ?? texte(entrant ? call.caller_deliverer_id : call.target_deliverer_id),
    nom: nomLivreur(d) ?? "Livreur",
    restaurant: texte(d?.restaurant?.name),
    courseReference: texte(call.course?.reference),
    sens: entrant ? "entrant" : "sortant",
  };
}

/**
 * « Rappeler » sur une ligne de l'historique avec un livreur : le livreur
 * lui-même, si on a le droit de l'appeler et qu'il est connu par son
 * identifiant. Sinon null.
 */
export function rappelLivreur(
  call: ICall,
  role: string | null | undefined,
  droitAppels: boolean,
): { delivererId: string; nom: string; detail: string } | null {
  const l = livreurDeLAppel(call);
  if (!l?.id || !peutAppelerLivreur(role, droitAppels)) return null;
  return { delivererId: l.id, nom: l.nom, detail: sousTitreLivreur(l.restaurant) };
}
