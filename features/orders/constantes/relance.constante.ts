import { RaisonIgnorer } from "../types/relance.types";

/**
 * Raisons d'ignorer une relance. Liste fermée, identique à celle du serveur
 * (RAISONS_IGNORER, backend/src/modules/order/relance/relance.rules.ts) :
 * elles disent pourquoi l'alerte ne demande pas d'appel, pas pourquoi le
 * client ne commande pas (ce sont les raisons du CRM).
 */
export const RAISONS_IGNORER: { code: RaisonIgnorer; libelle: string }[] = [
  { code: "CLIENT_INJOIGNABLE", libelle: "Client injoignable" },
  { code: "NE_VEUT_PLUS", libelle: "Le client ne souhaite plus commander" },
  { code: "DEJA_COMMANDE", libelle: "Le client a déjà commandé" },
  { code: "DOUBLON", libelle: "Doublon" },
  { code: "TEST_INTERNE", libelle: "Test interne" },
  { code: "AUTRE", libelle: "Autre" },
];

export const CODES_RAISONS = RAISONS_IGNORER.map((r) => r.code) as [RaisonIgnorer, ...RaisonIgnorer[]];

export const LIBELLE_RAISON: Record<string, string> = Object.fromEntries(
  RAISONS_IGNORER.map((r) => [r.code, r.libelle]),
);

/** Longueur maximale du texte libre de « Autre » (même borne que le serveur). */
export const RAISON_TEXTE_MAX = 160;

/**
 * Valeurs de repli quand la réponse ne les porte pas. Les défauts du
 * serveur : les textes de l'écran se construisent toujours à partir des
 * règles reçues, jamais d'un nombre écrit en dur dans une phrase.
 */
export const REGLES_PAR_DEFAUT = {
  delai_minutes: 3,
  duree_prise_minutes: 10,
  rappel_minutes: 5,
  fenetre_heures: 3,
};

/** Son des relances : distinct du ding-dong des retards. */
export const SON_RELANCE = "/musics/phone-vibration.mp3";

/** Verrou partagé entre les onglets du navigateur : un seul joue le son. */
export const VERROU_SON = "cn-relances-son";

/** Dernières alertes jouées dans ce navigateur (anti-doublon entre onglets). */
export const CLE_SONS_JOUES = "cn-relances-sons";
export const SONS_JOUES_MAX = 50;

/** Réglage « couper le son » de ce navigateur. */
export const CLE_REGLAGES_SON = "cn-relances-reglages";

/** Étiquette des notifications du système : une seule à la fois pour les relances. */
export const ETIQUETTE_NOTIFICATION = "cn-relance";

/** Événement temps réel du serveur, émis vers la salle des relances. */
export const EVENEMENT_RELANCE = "relance:changed";

export const LIBELLE_TYPE: Record<string, string> = {
  DELIVERY: "À livrer",
  PICKUP: "À emporter",
  TABLE: "Sur place",
};
