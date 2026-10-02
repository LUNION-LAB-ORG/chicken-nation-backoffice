/**
 * Relance des paniers de l'application restés en attente de paiement.
 *
 * Miroir du contrat du serveur (`GET /orders/relances` et ses actions,
 * backend/src/modules/order/controllers/order-relance.controller.ts). L'état
 * d'un groupe (à relancer, pris, paiement en cours) est calculé par le
 * serveur, jamais par l'écran : le front se contente de l'afficher.
 */

import type { CanalCommande } from "../utils/canal-commande";

export type EtatRelance = "A_RELANCER" | "PRIS" | "EN_COURS";

export type RaisonIgnorer =
  | "CLIENT_INJOIGNABLE"
  | "NE_VEUT_PLUS"
  | "DEJA_COMMANDE"
  | "DOUBLON"
  | "TEST_INTERNE"
  | "AUTRE";

/** Réglages appliqués par le serveur ; les textes de l'écran s'en déduisent. */
export interface ReglesRelance {
  delai_minutes: number;
  duree_prise_minutes: number;
  rappel_minutes: number;
  /** Constante du serveur ; absente, l'écran reprend la même valeur par défaut. */
  fenetre_heures?: number;
}

export interface CompteursRelance {
  a_relancer: number;
  pris: number;
  pris_par_moi: number;
  en_cours: number;
  ignorees: number;
  sorties?: number;
}

/** Un panier non payé (brouillon) de l'application. */
export interface BrouillonLigne {
  id: string;
  reference: string;
  created_at: string;
  /** Nom saisi, sinon celui du compte, sinon « Client sans nom » (serveur). */
  client_nom: string;
  telephone: string | null;
  restaurant: { id: string; name: string };
  type: "DELIVERY" | "PICKUP" | "TABLE";
  amount: number;
  paiement_refuse: boolean;
  /**
   * Panier annulé par le client dans l'application, sans avoir payé. Il reste
   * relançable : le reprendre au téléphone le réactive (acceptée, paiement à
   * la caisse). Absent d'un serveur plus ancien : lu comme `false`.
   */
  annulee_par_client: boolean;
  /**
   * Canal du panier (`Order.channel`) : WEB pour un panier du site. Vide pour
   * une commande antérieure au canal, absent d'un serveur plus ancien.
   */
  channel?: CanalCommande | string | null;
}

export interface PriseRelance {
  par: { id: string; fullname: string };
  le: string;
  expire_le: string;
  par_moi: boolean;
}

export interface SignauxRelance {
  /** Un paiement a été refusé sur l'un des paniers : l'appel le plus utile. */
  paiement_refuse: boolean;
  /** Paiements réussis qui ne couvrent pas le montant : le client a payé une partie. */
  paiement_partiel?: { recu: number; montant: number } | null;
  /** Commande payée juste avant le panier : doublon probable, à vérifier avant d'appeler. */
  commande_recente: { reference: string; created_at: string } | null;
  /**
   * Le client a annulé lui-même : date d'annulation de la tête, ou du panier
   * annulé le plus récent du groupe. Absent d'un serveur plus ancien.
   */
  annulee_par_client: { le: string } | null;
}

/** Les paniers d'un même client (même compte ou même numéro) : une alerte, un appel. */
export interface GroupeRelance {
  /** Identifiant de la tête (panier le plus récent non ignoré). */
  cle: string;
  etat: EtatRelance;
  tete: BrouillonLigne;
  autres: BrouillonLigne[];
  alerte_le: string | null;
  prise: PriseRelance | null;
  signaux: SignauxRelance;
  crm: { contact_id: string; statut: string; agent: string | null } | null;
}

export interface RelancesReponse {
  /** Horloge du serveur : l'écran s'y recale pour afficher les âges. */
  maintenant: string;
  regles: ReglesRelance;
  /** Prochain passage d'un paiement en cours au délai, ou prochaine fin de prise. */
  prochaine_echeance: string | null;
  compteurs: CompteursRelance;
  /** Triés par le serveur : pris par moi, à relancer (plus ancien d'abord), pris par d'autres, en cours. */
  groupes: GroupeRelance[];
}

export interface IgnoreeLigne extends BrouillonLigne {
  ignore_par: { id: string; fullname: string } | null;
  ignore_le: string;
  raison_code: RaisonIgnorer | string;
  raison_libelle: string;
  raison_texte: string | null;
  /** Le panier est-il toujours un brouillon (ni payé, ni annulé, ni repris) ? */
  encore_en_attente: boolean;
}

export interface IgnoreesReponse {
  items: IgnoreeLigne[];
}

export interface IgnorerRelanceDTO {
  raison_code: RaisonIgnorer;
  raison_texte?: string;
}

/** Charge de l'événement `relance:changed` : aucune donnée personnelle. */
export interface RelanceChangeeEvenement {
  motif:
    | "alerte"
    | "creation"
    | "paiement"
    | "sortie"
    | "prise"
    | "liberation"
    | "ignore"
    | "retablissement"
    | "reprise";
  ids: string[];
  /** Seulement pour `alerte` : têtes de groupe qui viennent de passer le délai. */
  nouvelles?: string[];
  par?: string;
}
