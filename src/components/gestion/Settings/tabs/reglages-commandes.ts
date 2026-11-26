/**
 * PARAMÈTRES > VENTE > COMMANDES DE L'APPLI, COMMANDES DU SITE : règles des
 * deux écrans, sans affichage (testées par `bun test`).
 *
 * Demande du client (26/11) : « on doit avoir le paramétrage pour le site et
 * le paramétrage pour l'appli, pareil pour commande à payer à la réception ».
 * Chaque canal a donc SES réglages, de même forme :
 *  - `order_type_<type>_<canal>` : « 1 » le type est proposé, « 0 » non ;
 *  - `order_paiement_<type>_<canal>` : `EN_LIGNE`, `A_LA_RECEPTION`, `LES_DEUX` ;
 *  - `order_paiement_reception_<canal>` : `DIRECTE` ou `APRES_CONFIRMATION`.
 * (`<canal>` : `appli` ou `site`.) Lus tels quels par le serveur
 * (`backend/src/modules/order/helpers/reglages-commande.rules.ts`), dont les
 * valeurs par défaut sont reprises ici : une clé absente affiche ce que le
 * serveur applique.
 *
 * La coupure temporaire de la livraison (les deux canaux, avec son message et
 * sa date de reprise) se règle dans Livraison > Frais et disponibilité : ces
 * écrans l'affichent sans la régler.
 */

export const CLE_COUPURE = "delivery.app_disabled";
export const CLE_COUPURE_JUSQUA = "delivery.app_disabled_until";

export type Valeurs = Record<string, string | undefined>;

/** Canal d'une commande passée par le client. */
export type Canal = "APP" | "WEB";

export type Parcours = "DIRECTE" | "APRES_CONFIRMATION";

export interface TypeDeCommande {
  cle: "livraison" | "emporter" | "sur_place";
  titre: string;
  /** Valeur du serveur quand la clé « proposé » est absente. */
  proposeParDefaut: boolean;
  /** Où le client paie « à la réception », tel que la liste l'écrit. */
  lieu: string;
}

export const TYPES_DE_COMMANDE: TypeDeCommande[] = [
  { cle: "livraison", titre: "Livraison", proposeParDefaut: true, lieu: "À la livraison" },
  { cle: "emporter", titre: "À emporter", proposeParDefaut: true, lieu: "Au restaurant" },
  { cle: "sur_place", titre: "Sur place", proposeParDefaut: false, lieu: "Au restaurant" },
];

export interface CanalDeVente {
  cle: Canal;
  /** Fin des clés de ce canal. */
  suffixe: "appli" | "site";
  titre: string;
  /** « l'application », « le site » dans une phrase. */
  nom: string;
  /** Types que ce canal sait vendre (le site n'a pas la commande sur place). */
  types: TypeDeCommande["cle"][];
  /** Parcours du serveur quand la clé est absente : ce que le canal faisait. */
  parcoursParDefaut: Parcours;
}

export const CANAUX: Record<Canal, CanalDeVente> = {
  APP: {
    cle: "APP",
    suffixe: "appli",
    titre: "Commandes de l'application",
    nom: "l'application",
    types: ["livraison", "emporter", "sur_place"],
    parcoursParDefaut: "DIRECTE",
  },
  WEB: {
    cle: "WEB",
    suffixe: "site",
    titre: "Commandes du site web",
    nom: "le site",
    types: ["livraison", "emporter"],
    parcoursParDefaut: "APRES_CONFIRMATION",
  },
};

/** Types réglables pour un canal, dans l'ordre d'affichage. */
export const typesDuCanal = (canal: CanalDeVente): TypeDeCommande[] =>
  TYPES_DE_COMMANDE.filter((t) => canal.types.includes(t.cle));

export const cleType = (type: TypeDeCommande, canal: CanalDeVente): string => `order_type_${type.cle}_${canal.suffixe}`;
export const clePaiement = (type: TypeDeCommande, canal: CanalDeVente): string =>
  `order_paiement_${type.cle}_${canal.suffixe}`;
export const cleParcours = (canal: CanalDeVente): string => `order_paiement_reception_${canal.suffixe}`;

/** Toutes les clés que les deux écrans enregistrent. */
export const CLES_DES_ECRANS: string[] = Object.values(CANAUX).flatMap((canal) => [
  ...typesDuCanal(canal).flatMap((t) => [cleType(t, canal), clePaiement(t, canal)]),
  cleParcours(canal),
]);

/** « 1 », « true », « oui » : vrai. Même lecture que le serveur. */
export const estVrai = (valeur: string | undefined): boolean =>
  ["1", "true", "oui"].includes((valeur ?? "").trim().toLowerCase());

/** Le type est-il proposé sur ce canal ? Clé absente : la valeur par défaut. */
export function typePropose(type: TypeDeCommande, canal: CanalDeVente, valeurs: Valeurs): boolean {
  const brut = (valeurs[cleType(type, canal)] ?? "").trim();
  return brut === "" ? type.proposeParDefaut : estVrai(brut);
}

const PAIEMENTS = ["EN_LIGNE", "A_LA_RECEPTION", "LES_DEUX"];

/** Choix du paiement d'un type, avec le lieu du paiement à la réception. */
export const choixPaiement = (lieu: string) => [
  { value: "EN_LIGNE", label: "En ligne seulement" },
  { value: "A_LA_RECEPTION", label: `${lieu} seulement` },
  { value: "LES_DEUX", label: `En ligne ou ${lieu.toLowerCase()}` },
];

/**
 * Paiement affiché pour un type sur un canal : ce que le serveur applique.
 *
 * `order_paiement_livraison_site` est la clé du 19/10 (« 1 » le paiement à la
 * livraison est proposé sur le site, « 0 » non) : « 1 », ou absente, vaut
 * « en ligne ou à la livraison » ; « 0 », en ligne seulement. Partout
 * ailleurs, une clé absente ou illisible vaut « en ligne seulement ».
 */
export function paiementAffiche(type: TypeDeCommande, canal: CanalDeVente, valeurs: Valeurs): string {
  const lue = (valeurs[clePaiement(type, canal)] ?? "").trim().toUpperCase();
  if (PAIEMENTS.includes(lue)) return lue;
  if (canal.cle === "WEB" && type.cle === "livraison" && (lue === "" || estVrai(lue))) return "LES_DEUX";
  return "EN_LIGNE";
}

/** Parcours affiché pour un canal ; absent ou illisible : sa valeur par défaut. */
export function parcoursAffiche(canal: CanalDeVente, valeurs: Valeurs): Parcours {
  const lue = (valeurs[cleParcours(canal)] ?? "").trim().toUpperCase();
  return lue === "DIRECTE" || lue === "APRES_CONFIRMATION" ? lue : canal.parcoursParDefaut;
}

/**
 * La coupure temporaire de la livraison est-elle en vigueur ? Une date de
 * reprise passée la lève d'elle-même, comme sur le serveur.
 */
export function coupureEnVigueur(valeurs: Valeurs, maintenant: Date = new Date()): boolean {
  if (!estVrai(valeurs[CLE_COUPURE])) return false;
  const jusqua = (valeurs[CLE_COUPURE_JUSQUA] ?? "").trim();
  if (!jusqua) return true;
  const date = new Date(jusqua);
  return Number.isNaN(date.getTime()) || maintenant < date;
}

/**
 * Clés à enregistrer : celles qui diffèrent de la base, pour les deux canaux
 * (changer d'onglet ne perd pas une saisie). Un réglage vide et un réglage
 * absent sont le même.
 */
export function clesAEnregistrer(valeurs: Valeurs, enBase: Valeurs): string[] {
  return CLES_DES_ECRANS.filter((cle) => valeurs[cle] !== undefined && (valeurs[cle] ?? "") !== (enBase[cle] ?? ""));
}

/** Libellé enregistré avec le réglage (colonne `description` de la base). */
export function libelleDuReglage(cle: string): string {
  for (const canal of Object.values(CANAUX)) {
    const ou = canal.cle === "APP" ? "Application" : "Site web";
    if (cle === cleParcours(canal)) return `${ou} : commande à payer à la réception`;
    for (const type of typesDuCanal(canal)) {
      if (cle === cleType(type, canal)) return `${ou}, ${type.titre.toLowerCase()} : proposé`;
      if (cle === clePaiement(type, canal)) return `${ou}, ${type.titre.toLowerCase()} : paiement de la commande`;
    }
  }
  return cle;
}
