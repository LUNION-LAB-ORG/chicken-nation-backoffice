/**
 * PARAMÈTRES > VENTE > COMMANDES : règles de l'écran, sans affichage (testées
 * par `bun test`).
 *
 * Un seul endroit règle ce que les clients de l'application et du site
 * peuvent commander (26/11) : pour chaque type, où il est proposé et comment
 * il se paie, puis ce que devient une commande à payer à la réception.
 *
 * PAR CANAL (« on doit cocher site web ou appli ») : chaque type se coche
 * pour l'application et pour le site web. La valeur enregistrée est la liste
 * des canaux cochés (`APP,WEB`, `APP`, `WEB`, « 0 » pour aucun), lue telle
 * quelle par le serveur (`lireCanauxDuType`).
 *
 * La LIVRAISON se coupait à deux endroits : le type « Livraison » ici, et
 * « Disponibilité de la livraison » dans l'onglet Livraison (la coupure, avec
 * son message et sa date de reprise). Les deux sont réunis ici : décocher les
 * deux canaux de la livraison écrit la coupure (`delivery.app_disabled`),
 * avec le message montré au client et la reprise automatique ; à la reprise,
 * la livraison revient sur les deux canaux. Un seul canal décoché : le type
 * est retiré de ce canal, sans date.
 */

export const CLE_COUPURE = "delivery.app_disabled";
export const CLE_COUPURE_JUSQUA = "delivery.app_disabled_until";
export const CLE_COUPURE_MESSAGE = "delivery.app_disabled_message";
export const CLE_TYPE_LIVRAISON = "order_type_livraison";
export const CLE_PARCOURS = "order_paiement_reception";
/** Ancien réglage « Paiement à la livraison sur le site » (19/10), sans écran depuis le 26/11. */
export const CLE_ANCIEN_PAIEMENT_SITE = "order_paiement_livraison_site";

export type Valeurs = Record<string, string | undefined>;

/** Canal d'une commande passée par le client. */
export type Canal = "APP" | "WEB";

export const CANAUX: { cle: Canal; libelle: string }[] = [
  { cle: "APP", libelle: "Appli" },
  { cle: "WEB", libelle: "Site web" },
];

const TOUS_LES_CANAUX: Canal[] = ["APP", "WEB"];

export interface TypeDeCommande {
  cle: "livraison" | "emporter" | "sur_place";
  titre: string;
  /** Clé des canaux où le type est proposé. */
  actif: string;
  /** Clé du paiement permis. */
  paiement: string;
  /** Canaux du serveur quand la clé est absente. */
  canauxParDefaut: Canal[];
  /** Canaux qui savent proposer ce type (le site n'a pas la commande sur place). */
  canauxPossibles: Canal[];
  /** Où le client paie « à la réception », tel que la liste l'écrit. */
  lieu: string;
}

export const TYPES_DE_COMMANDE: TypeDeCommande[] = [
  {
    cle: "livraison",
    titre: "Livraison",
    actif: CLE_TYPE_LIVRAISON,
    paiement: "order_paiement_livraison",
    canauxParDefaut: TOUS_LES_CANAUX,
    canauxPossibles: TOUS_LES_CANAUX,
    lieu: "À la livraison",
  },
  {
    cle: "emporter",
    titre: "À emporter",
    actif: "order_type_emporter",
    paiement: "order_paiement_emporter",
    canauxParDefaut: TOUS_LES_CANAUX,
    canauxPossibles: TOUS_LES_CANAUX,
    lieu: "Au restaurant",
  },
  {
    cle: "sur_place",
    titre: "Sur place",
    actif: "order_type_sur_place",
    paiement: "order_paiement_sur_place",
    canauxParDefaut: [],
    canauxPossibles: ["APP"],
    lieu: "Au restaurant",
  },
];

/** Toutes les clés que l'onglet enregistre. */
export const CLES_DE_L_ONGLET: string[] = [
  ...TYPES_DE_COMMANDE.flatMap((t) => [t.actif, t.paiement]),
  CLE_PARCOURS,
  CLE_COUPURE,
  CLE_COUPURE_JUSQUA,
  CLE_COUPURE_MESSAGE,
];

/** « 1 », « true », « oui » : vrai. Même lecture que le serveur. */
export const estVrai = (valeur: string | undefined): boolean =>
  ["1", "true", "oui"].includes((valeur ?? "").trim().toLowerCase());

/** Choix du paiement d'un type, avec le lieu du paiement à la réception. */
export const choixPaiement = (lieu: string) => [
  { value: "EN_LIGNE", label: "En ligne seulement" },
  { value: "A_LA_RECEPTION", label: `${lieu} seulement` },
  { value: "LES_DEUX", label: `En ligne ou ${lieu.toLowerCase()}` },
];

/**
 * Paiement affiché pour un type. Clé absente : ce que le serveur applique
 * alors. La livraison part de l'ancien réglage du site (proposé, ou jamais
 * réglé : en ligne ou à la livraison ; coupé : en ligne seulement).
 */
export function paiementAffiche(type: TypeDeCommande, valeurs: Valeurs): string {
  const enregistre = valeurs[type.paiement];
  if (enregistre) return enregistre;
  if (type.cle !== "livraison") return "EN_LIGNE";
  const ancien = (valeurs[CLE_ANCIEN_PAIEMENT_SITE] ?? "").trim();
  return ancien === "" || estVrai(ancien) ? "LES_DEUX" : "EN_LIGNE";
}

/**
 * La coupure de la livraison est-elle en vigueur ? Une date de reprise passée
 * la lève d'elle-même, comme sur le serveur.
 */
export function coupureEnVigueur(valeurs: Valeurs, maintenant: Date = new Date()): boolean {
  if (!estVrai(valeurs[CLE_COUPURE])) return false;
  const jusqua = (valeurs[CLE_COUPURE_JUSQUA] ?? "").trim();
  if (!jusqua) return true;
  const date = new Date(jusqua);
  return Number.isNaN(date.getTime()) || maintenant < date;
}

const MOTS_DU_CANAL: Record<string, Canal> = { APP: "APP", APPLI: "APP", APPLICATION: "APP", WEB: "WEB", SITE: "WEB" };

/**
 * Canaux lus dans la valeur d'un réglage, comme le serveur : liste de canaux,
 * « 1 » les deux, vide ou absent la valeur par défaut, et tout mot inconnu
 * ignoré (« 0 » : aucun).
 */
export function lireCanaux(valeur: string | undefined, defaut: Canal[]): Canal[] {
  const lue = (valeur ?? "").trim().toUpperCase();
  if (lue === "") return [...defaut];
  if (estVrai(lue)) return [...TOUS_LES_CANAUX];
  const coches = new Set(lue.split(/[\s,;+|]+/).map((mot) => MOTS_DU_CANAL[mot]));
  return TOUS_LES_CANAUX.filter((canal) => coches.has(canal));
}

/**
 * Canaux où le type est proposé, tels que l'écran les coche. Livraison coupée
 * (coupure en vigueur) : aucun, quel que soit ce qui est enregistré.
 */
export function canauxCoches(type: TypeDeCommande, valeurs: Valeurs, maintenant: Date = new Date()): Canal[] {
  if (type.cle === "livraison" && coupureEnVigueur(valeurs, maintenant)) return [];
  return lireCanaux(valeurs[type.actif], type.canauxParDefaut).filter((c) => type.canauxPossibles.includes(c));
}

/** Valeur enregistrée pour une liste de canaux. */
const ecrireListe = (canaux: Canal[]): string => (canaux.length ? canaux.join(",") : "0");

/**
 * Ce qu'écrit le fait de cocher ou décocher un canal.
 *
 * Livraison, plus aucun canal coché : c'est la coupure (son message et sa
 * date restent ceux saisis). Le type garde ses deux canaux, pour que la
 * reprise automatique rende la livraison partout. Au moins un canal coché :
 * la coupure est levée, sa date vidée, et le type porte les canaux cochés.
 */
export function ecrireCanaux(type: TypeDeCommande, canaux: Canal[], valeurs: Valeurs): Valeurs {
  const retenus = TOUS_LES_CANAUX.filter((c) => canaux.includes(c) && type.canauxPossibles.includes(c));
  if (type.cle !== "livraison") return { ...valeurs, [type.actif]: ecrireListe(retenus) };
  if (retenus.length === 0) {
    return { ...valeurs, [CLE_TYPE_LIVRAISON]: ecrireListe(TOUS_LES_CANAUX), [CLE_COUPURE]: "1" };
  }
  return { ...valeurs, [CLE_TYPE_LIVRAISON]: ecrireListe(retenus), [CLE_COUPURE]: "0", [CLE_COUPURE_JUSQUA]: "" };
}

/** Coche ou décoche un canal, à partir de ce que l'écran affiche. */
export function basculerCanal(type: TypeDeCommande, canal: Canal, coche: boolean, valeurs: Valeurs): Valeurs {
  const actuels = canauxCoches(type, valeurs);
  const suivants = coche ? [...actuels, canal] : actuels.filter((c) => c !== canal);
  return ecrireCanaux(type, suivants, valeurs);
}

/**
 * Clés à enregistrer : celles qui diffèrent de la base. Un réglage vide et un
 * réglage absent sont le même : vider un champ jamais enregistré n'est pas une
 * modification.
 */
export function clesAEnregistrer(valeurs: Valeurs, enBase: Valeurs): string[] {
  return CLES_DE_L_ONGLET.filter((cle) => valeurs[cle] !== undefined && (valeurs[cle] ?? "") !== (enBase[cle] ?? ""));
}

/** Libellé enregistré avec le réglage (colonne `description` de la base). */
export function libelleDuReglage(cle: string): string {
  if (cle === CLE_PARCOURS) return "Commande à payer à la réception";
  if (cle === CLE_COUPURE) return "Livraison coupée";
  if (cle === CLE_COUPURE_JUSQUA) return "Livraison coupée jusqu'au";
  if (cle === CLE_COUPURE_MESSAGE) return "Livraison coupée : message au client";
  const type = TYPES_DE_COMMANDE.find((t) => t.actif === cle || t.paiement === cle);
  if (!type) return cle;
  return cle === type.actif ? `${type.titre} : proposé sur (canaux)` : `${type.titre} : paiement de la commande`;
}
