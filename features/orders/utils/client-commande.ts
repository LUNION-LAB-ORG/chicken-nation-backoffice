import { normalizePhoneInternational } from "../../customer/utils/customerFormValidation";

/**
 * Client d'une commande dans le formulaire (création et modification, 27/11).
 *
 * Le numéro de téléphone désigne le client :
 *  - même numéro que le client rattaché : c'est lui, quel que soit le nom
 *    saisi (le nom saisi est seulement inscrit sur la commande) ;
 *  - autre numéro : ce n'est plus lui. Le numéro est cherché ; connu, la
 *    commande passe à ce client ; inconnu, c'est un nouveau client à
 *    enregistrer.
 *
 * Avant, en modification, le client de la commande restait rattaché quoi
 * qu'on saisisse : changer le nom et le numéro ne changeait pas le client.
 *
 * Fonctions pures, sans composant ni réseau.
 */

/** Le client auquel le formulaire est rattaché. */
export interface ClientRattache {
  id: string;
  fullname: string;
  phone: string;
  email: string;
}

export interface SaisieClient {
  fullname?: string | null;
  phone?: string | null;
  email?: string | null;
}

/** Numéro au format du serveur (`+225…`), ou `null` s'il est incomplet. */
export const numeroCanonique = (telephone: string | null | undefined): string | null =>
  normalizePhoneInternational(telephone ?? "");

/** Deux saisies du même numéro (espaces, indicatif, écriture locale). */
export const memeNumero = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => {
  const ca = numeroCanonique(a);
  const cb = numeroCanonique(b);
  if (ca && cb) return ca === cb;
  const brut = (v: string | null | undefined) => (v ?? "").replace(/\s/g, "");
  return brut(a) !== "" && brut(a) === brut(b);
};

export type EtatClientCommande =
  /** Rien de saisi. */
  | { etat: "vide" }
  /** Le numéro saisi est celui du client rattaché. */
  | { etat: "rattache"; client: ClientRattache }
  /** Autre client : `telephone` est le numéro à chercher, `null` s'il est incomplet. */
  | { etat: "autre"; telephone: string | null };

export const etatClientCommande = (
  saisie: SaisieClient,
  rattache: ClientRattache | null,
): EtatClientCommande => {
  if (rattache && memeNumero(saisie.phone, rattache.phone)) {
    return { etat: "rattache", client: rattache };
  }
  if (!saisie.fullname?.trim() && !saisie.phone?.trim() && !saisie.email?.trim()) {
    return { etat: "vide" };
  }
  return { etat: "autre", telephone: numeroCanonique(saisie.phone) };
};

interface ClientDuServeur {
  id: string;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

/** Fiche d'un client du serveur, telle que le formulaire la garde. */
export const ficheClient = (client: ClientDuServeur): ClientRattache => ({
  id: client.id,
  fullname: [client.first_name, client.last_name].filter(Boolean).join(" ").trim(),
  phone: client.phone ?? "",
  email: client.email ?? "",
});

/** Texte à chercher pour un numéro : ses chiffres, sans le « + ». */
export const rechercheDuNumero = (canonique: string): string => canonique.replace(/^\+/, "");

/** Parmi des clients trouvés, celui qui porte exactement ce numéro. */
export const clientAuNumero = <T extends ClientDuServeur>(
  clients: T[] | null | undefined,
  telephone: string,
): T | null => (clients ?? []).find((c) => memeNumero(c.phone, telephone)) ?? null;

/**
 * Modification : la commande change-t-elle de client ? Vrai dès que la saisie
 * ne désigne plus le client d'origine (autre client connu, ou nouveau).
 */
export const changeDeClient = (
  depart: ClientRattache | null,
  rattache: ClientRattache | null,
  nouveau: boolean,
): boolean => {
  if (!depart) return false;
  if (nouveau) return true;
  return !!rattache && rattache.id !== depart.id;
};

/** Prénom (premier mot) et nom (le reste), comme l'enregistrement d'un client. */
export const prenomEtNom = (fullname: string | null | undefined) => {
  const mots = (fullname ?? "").trim().split(/\s+/).filter(Boolean);
  return { first_name: mots[0] ?? "", last_name: mots.slice(1).join(" ") };
};
