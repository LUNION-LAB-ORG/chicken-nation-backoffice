/**
 * Appels avec un client dans l'appli Chicken Nation (demande du 26/11,
 * serveur au commit 3cea51a).
 *
 *  - Le client appelle le service client depuis son appli : la sonnerie du
 *    centre d'appels montre qui appelle (nom, téléphone) et sa commande.
 *  - Le service client (ou l'admin) appelle un client dans l'appli depuis une
 *    commande ou sa fiche : `POST /calls` avec
 *    `{ targetKind: "CUSTOMER", customer_id, order_id }`. Le serveur refuse
 *    (`CLIENT_SANS_APPLI`) quand l'appli du client ne sait pas prendre un
 *    appel : le numéro reste à côté du bouton.
 *  - L'historique nomme le client au lieu de « Appelant ».
 *
 * Fonctions pures, sans React : testées par `bun test`.
 */

import { UserRole } from "../../users/types/user.types";
import type { IAppelantClient, ICall, IIncomingCallEvent } from "../types/call.type";
import { telephoneLisible } from "./appel-livreur";

/** Nature de la cible et type de l'appelant quand c'est un client. */
export const CLIENT = "CUSTOMER";

/** Codes des refus du serveur (champ `code` du corps d'erreur). */
export const CODES_APPEL_CLIENT = {
  DESACTIVES: "APPELS_CLIENTS_DESACTIVES",
  EN_COURS: "APPEL_EN_COURS",
  INDISPONIBLES: "APPELS_INDISPONIBLES",
  SANS_APPLI: "CLIENT_SANS_APPLI",
} as const;

const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** « Awa Koné » depuis prénom et nom ; sinon le téléphone ; sinon null. */
export function nomClient(
  c: { first_name?: unknown; last_name?: unknown; phone?: unknown } | null | undefined,
): string | null {
  if (!c) return null;
  const nom = [texte(c.first_name), texte(c.last_name)].filter(Boolean).join(" ");
  return nom || texte(c.phone);
}

// ============================================================
// SONNERIE : APPEL VENANT D'UN CLIENT
// ============================================================

export interface AppelantClient {
  id: string | null;
  nom: string;
  telephone: string | null;
  /** Commande dont il parle, null sans commande. */
  commandeId: string | null;
  commandeReference: string | null;
}

/** L'appel vient-il d'un client ? */
export function estAppelClient(e: Pick<IIncomingCallEvent, "callerType"> | null | undefined): boolean {
  return e?.callerType === CLIENT;
}

/**
 * Qui appelle, quand c'est un client : le champ `client` de `call:incoming`
 * (et de chaque entrée de `GET /calls/ringing`). Pas un client : null.
 */
export function lireAppelantClient(e: IIncomingCallEvent | null | undefined): AppelantClient | null {
  if (!e || !estAppelClient(e)) return null;
  const c = e.client;
  return {
    id: texte(c?.id) ?? texte(e.callerId),
    nom: texte(c?.nom) ?? texte(e.callerName) ?? "Client",
    telephone: texte(c?.telephone),
    commandeId: texte(c?.commande_id),
    commandeReference: texte(c?.commande_reference),
  };
}

/** « Commande ORD-261126-00042 », ou null sans commande (rien à afficher). */
export function texteCommande(reference: string | null | undefined): string | null {
  const r = texte(reference);
  return r ? `Commande ${r}` : null;
}

/** Ce que montre la sonnerie sous le nom du client, ligne par ligne. */
export function lignesSonnerieClient(a: AppelantClient): {
  sousTitre: string;
  telephone: string | null;
  commande: string | null;
} {
  return {
    sousTitre: "Client",
    telephone: telephoneLisible(a.telephone),
    commande: texteCommande(a.commandeReference),
  };
}

/** « Client · Commande ORD-261126-00042 », ou « Client » sans commande. */
export function detailClient(commandeReference: string | null | undefined): string {
  const commande = texteCommande(commandeReference);
  return commande ? `Client · ${commande}` : "Client";
}

/** Une ligne pour la notification du navigateur et le panneau d'appel. */
export function detailAppelClient(a: AppelantClient): string {
  return detailClient(a.commandeReference);
}

/** La même ligne depuis le champ `client` du serveur (`POST /calls`, `GET /calls/active`). */
export function detailClientDepuisServeur(c: IAppelantClient | null | undefined): string | null {
  return c ? detailClient(c.commande_reference) : null;
}

// ============================================================
// APPELER UN CLIENT DANS L'APPLI
// ============================================================

/** Rôles que le serveur autorise à appeler un client dans l'appli : l'admin et le service client. */
const ROLES_APPEL_CLIENT: ReadonlySet<string> = new Set([UserRole.ADMIN, UserRole.CALL_CENTER]);

/**
 * Le bouton « Appeler dans l'appli » s'affiche-t-il ? Il faut un rôle que le
 * serveur autorise ET le droit de lire les appels (module `calls`).
 */
export function peutAppelerClient(role: string | null | undefined, droitAppels: boolean): boolean {
  return droitAppels && !!role && ROLES_APPEL_CLIENT.has(role);
}

/** « Appeler Awa Koné dans l'appli » : titre et libellé lu du bouton. */
export function titreBoutonAppelClient(nom: string | null | undefined): string {
  return `Appeler ${texte(nom) ?? "le client"} dans l'appli`;
}

/**
 * Message quand le client n'a pas l'appli ouverte au moment de l'appel
 * (`online: 0` dans la réponse de `POST /calls`). Il reçoit quand même une
 * notification.
 */
export function texteClientSansConnexion(nom: string | null | undefined): string {
  return `${texte(nom) ?? "Le client"} n'a pas l'appli ouverte : une notification lui est envoyée.`;
}

/**
 * Refus de `POST /calls` vers un client, en une phrase courte. L'erreur est
 * celle de `apiRequest` : `status`, et `code` quand le serveur en donne un.
 */
export function texteErreurAppelClient(erreur: unknown): string {
  const e = (erreur && typeof erreur === "object" ? erreur : {}) as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };
  const status = typeof e.status === "number" ? e.status : null;
  const code = texte(e.code);
  if (code === CODES_APPEL_CLIENT.SANS_APPLI) {
    return "L'appli de ce client ne peut pas recevoir d'appel. Appelez-le au téléphone.";
  }
  if (code === CODES_APPEL_CLIENT.DESACTIVES) return "Les appels avec les clients dans l'appli sont coupés.";
  if (code === CODES_APPEL_CLIENT.EN_COURS || status === 409) return "Ce client est déjà en appel.";
  if (code === CODES_APPEL_CLIENT.INDISPONIBLES || (status !== null && status >= 500)) {
    return "Service d'appel indisponible, réessayez dans un instant.";
  }
  if (status === 404) return "Client introuvable.";
  if (status === 403) return "Votre profil ne peut pas appeler un client dans l'appli.";
  const message = texte(e.message);
  if (status === null && message?.startsWith("Session expirée")) return message;
  return "Impossible d'appeler le client dans l'appli.";
}

/**
 * Fin d'un appel vers un client avant qu'il décroche (`call:ended`) : il a
 * refusé, ou n'a pas répondu en 45 s. Autre raison : rien à dire.
 */
export function texteFinAppelClient(raison: string | null | undefined, nom: string): string | null {
  const qui = texte(nom) ?? "Le client";
  if (raison === "rejected") return `${qui} n'est pas disponible`;
  if (raison === "no-answer") return `${qui} n'a pas répondu`;
  return null;
}

// ============================================================
// HISTORIQUE
// ============================================================

export interface ClientDeLAppel {
  id: string | null;
  nom: string;
  commandeId: string | null;
  commandeReference: string | null;
  /** Le client a appelé (entrant) ou a été appelé (sortant). */
  sens: "entrant" | "sortant";
}

/**
 * Client d'un appel de l'historique : l'appelant (`caller_customer`) ou la
 * cible (`target_customer`). Appel sans client : null.
 */
export function clientDeLAppel(call: ICall): ClientDeLAppel | null {
  const entrant = call.caller_type === CLIENT || !!call.caller_customer_id || !!call.caller_customer;
  const sortant = call.target_kind === CLIENT;
  if (!entrant && !sortant) return null;
  const c = entrant ? call.caller_customer : call.target_customer;
  return {
    id: texte(c?.id) ?? texte(entrant ? call.caller_customer_id : call.target_customer_id),
    nom: nomClient(c) ?? "Client",
    commandeId: texte(call.order?.id) ?? texte(call.order_id),
    commandeReference: texte(call.order?.reference),
    sens: entrant ? "entrant" : "sortant",
  };
}

/**
 * « Rappeler » sur une ligne de l'historique avec un client : le client
 * lui-même, dans l'appli, si on a le droit de l'appeler et qu'il est connu
 * par son identifiant. Sinon null.
 */
export function rappelClient(
  call: ICall,
  role: string | null | undefined,
  droitAppels: boolean,
): { customerId: string; orderId: string | null; nom: string; detail: string } | null {
  const c = clientDeLAppel(call);
  if (!c?.id || !peutAppelerClient(role, droitAppels)) return null;
  return { customerId: c.id, orderId: c.commandeId, nom: c.nom, detail: detailClient(c.commandeReference) };
}
