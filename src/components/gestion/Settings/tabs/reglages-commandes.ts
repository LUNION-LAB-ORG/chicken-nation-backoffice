/**
 * PARAMÈTRES > VENTE > COMMANDES : règles de l'écran, sans affichage (testées
 * par `bun test`).
 *
 * Un seul endroit règle ce que les clients de l'application et du site
 * peuvent commander (26/11) : pour chaque type, s'il est proposé et comment
 * il se paie, puis ce que devient une commande à payer à la réception.
 *
 * La LIVRAISON se coupait à deux endroits : le type « Livraison » ici, et
 * « Disponibilité de la livraison » dans l'onglet Livraison (la coupure, avec
 * son message et sa date de reprise). Les deux sont réunis ici : « Livraison :
 * Non » écrit la coupure (`delivery.app_disabled`), avec le message montré au
 * client et la reprise automatique. Le serveur lit toujours les deux clés ;
 * l'écran remet l'ancienne (`order_type_livraison`) à « proposé » pour qu'il
 * ne reste aucun interrupteur caché.
 */

export const CLE_COUPURE = "delivery.app_disabled";
export const CLE_COUPURE_JUSQUA = "delivery.app_disabled_until";
export const CLE_COUPURE_MESSAGE = "delivery.app_disabled_message";
export const CLE_TYPE_LIVRAISON = "order_type_livraison";
export const CLE_PARCOURS = "order_paiement_reception";
/** Ancien réglage « Paiement à la livraison sur le site » (19/10), sans écran depuis le 26/11. */
export const CLE_ANCIEN_PAIEMENT_SITE = "order_paiement_livraison_site";

export type Valeurs = Record<string, string | undefined>;

export interface TypeDeCommande {
  cle: "livraison" | "emporter" | "sur_place";
  titre: string;
  /** Clé « proposé ou non ». */
  actif: string;
  /** Clé du paiement permis. */
  paiement: string;
  /** Valeur du serveur quand la clé « proposé » est absente. */
  actifParDefaut: "0" | "1";
  /** Où le client paie « à la réception », tel que la liste l'écrit. */
  lieu: string;
  /** Le site ne propose pas ce type. */
  appliSeulement?: boolean;
}

export const TYPES_DE_COMMANDE: TypeDeCommande[] = [
  {
    cle: "livraison",
    titre: "Livraison",
    actif: CLE_TYPE_LIVRAISON,
    paiement: "order_paiement_livraison",
    actifParDefaut: "1",
    lieu: "À la livraison",
  },
  {
    cle: "emporter",
    titre: "À emporter",
    actif: "order_type_emporter",
    paiement: "order_paiement_emporter",
    actifParDefaut: "1",
    lieu: "Au restaurant",
  },
  {
    cle: "sur_place",
    titre: "Sur place",
    actif: "order_type_sur_place",
    paiement: "order_paiement_sur_place",
    actifParDefaut: "0",
    lieu: "Au restaurant",
    appliSeulement: true,
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

/** Le type est-il proposé aux clients ? Pour la livraison : ni retirée, ni coupée. */
export function typePropose(type: TypeDeCommande, valeurs: Valeurs, maintenant: Date = new Date()): boolean {
  const brut = valeurs[type.actif];
  const actif = brut === undefined || brut.trim() === "" ? type.actifParDefaut === "1" : estVrai(brut);
  if (type.cle !== "livraison") return actif;
  return actif && !coupureEnVigueur(valeurs, maintenant);
}

/**
 * Ce que le choix « proposé ou non » écrit. Pour la livraison, « Non » écrit
 * la coupure (son message et sa date restent ceux saisis) ; « Oui » la lève
 * et vide la date de reprise, qui n'a plus de sens. L'ancienne clé repasse à
 * « proposé » dans les deux cas.
 */
export function ecrireTypePropose(type: TypeDeCommande, propose: boolean, valeurs: Valeurs): Valeurs {
  if (type.cle !== "livraison") return { ...valeurs, [type.actif]: propose ? "1" : "0" };
  return {
    ...valeurs,
    [CLE_TYPE_LIVRAISON]: "1",
    [CLE_COUPURE]: propose ? "0" : "1",
    ...(propose ? { [CLE_COUPURE_JUSQUA]: "" } : {}),
  };
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
  return cle === type.actif ? `${type.titre} : proposé aux clients` : `${type.titre} : paiement de la commande`;
}
