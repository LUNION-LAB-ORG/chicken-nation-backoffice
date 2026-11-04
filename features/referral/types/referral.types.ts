export interface ReferralGlobalStats {
  total: number;
  pending: number;
  rewarded: number;
  cancelled: number;
}

export interface ReferralParrainReward {
  type: string; // RewardType : VOUCHER | PROMO_CODE | GIFT
  payload: Record<string, unknown>;
  expires_in_days?: number;
}

/**
 * Réglages monétaires du programme ambassadeur (Phase 5). Tous exprimés en FCFA
 * sauf `commission_pct` (pourcentage) et `commission_window_days` (jours).
 * Valeurs par défaut posées côté serveur ; l'admin cale les vraies valeurs.
 */
export interface ReferralMonetaryConfig {
  /** Prime fixe versée à l'ambassadeur quand un filleul devient qualifié (FCFA). */
  prime_amount: number;
  /** % de commission sur chaque commande payée du filleul dans la fenêtre. */
  commission_pct: number;
  /** Durée de la fenêtre de commission après la 1re commande qualifiante (jours). */
  commission_window_days: number;
  /** Plafond total (prime + commissions) PAR FILLEUL (FCFA, 0 = pas de plafond). */
  cap_per_referee: number;
  /** Panier minimum d'une commande pour qualifier / générer de la commission (FCFA). */
  min_qualifying_basket: number;
  /** Solde payable minimum avant de pouvoir verser un ambassadeur (FCFA). */
  payout_threshold: number;
}

export interface ReferralConfig extends ReferralMonetaryConfig {
  welcome_amount: number;
  parrain: ReferralParrainReward;
  created_by: string | null;
}

export interface SetReferralConfigPayload extends Partial<ReferralMonetaryConfig> {
  welcome_amount?: number;
  parrain?: ReferralParrainReward;
  created_by?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Ambassadeurs & versements                                                  */
/* -------------------------------------------------------------------------- */

/** Ligne de la liste des ambassadeurs (parrains monétisés). */
export interface Ambassador {
  customer_id: string;
  fullname: string | null;
  phone: string | null;
  referral_code: string | null;
  /** Code d'avant le 03/11 (CNABC23), toujours valable. */
  referral_code_ancien: string | null;
  /** Nombre de filleuls rattachés (parrainages annulés exclus). */
  referees_count: number;
  /** Filleuls ayant passé leur 1re commande qualifiante. */
  qualified_referees_count: number;
  /** Inscription du dernier filleul (liste seulement). */
  last_referee_at?: string | null;
  /** Ventes des filleuls : commandes payées et terminées (FCFA). */
  generated_sales: number;
  /** Cumul des gains (prime + commission) toutes catégories (FCFA). */
  total_earned: number;
  /** Solde en attente de bascule PAYABLE (FCFA). */
  pending_amount: number;
  /** Solde marqué payable, non encore versé (FCFA). */
  payable_amount: number;
  /** Cumul déjà versé (FCFA). */
  paid_amount: number;
}

export type ReferralEarningKind = "PRIME" | "COMMISSION";
export type ReferralEarningStatus = "PENDING" | "PAYABLE" | "PAID" | "CANCELLED";

/** Gain unitaire d'un ambassadeur (prime d'un filleul ou commission d'une commande). */
export interface ReferralEarning {
  id: string;
  kind: ReferralEarningKind;
  status: ReferralEarningStatus;
  amount: number;
  /** Filleul concerné. */
  referee_id: string;
  referee_name: string | null;
  /** Commande source (COMMISSION) ou 1re commande qualifiante (PRIME). */
  order_id: string | null;
  order_number: string | null;
  /** Montant de la commande source (FCFA), utile pour l'assiette de commission. */
  order_amount: number | null;
  created_at: string;
}

/** Enregistrement d'un versement (marquage manuel au backoffice). */
export interface ReferralPayout {
  id: string;
  ambassador_id: string;
  amount: number;
  note: string | null;
  /** Staff ayant marqué payé. */
  paid_by: string | null;
  paid_by_name: string | null;
  created_at: string;
}

export type ReferralStatus = "PENDING" | "REWARDED" | "CANCELLED";

/** Filleul d'un parrain. */
export interface AmbassadorFilleul {
  /** Identifiant du parrainage (pour l'annuler). */
  id: string;
  customer_id: string;
  fullname: string | null;
  phone: string | null;
  /** PENDING = inscrit, REWARDED = qualifié (prime versée au parrain). */
  status: ReferralStatus;
  joined_at: string;
  qualified_at: string | null;
  sales: number;
  orders_count: number;
}

/** Détail d'un ambassadeur (soldes + filleuls + gains + historique versements). */
export interface AmbassadorDetail extends Ambassador {
  filleuls: AmbassadorFilleul[];
  earnings: ReferralEarning[];
  payouts: ReferralPayout[];
}

/** Client proposé pour devenir parrain ou filleul. */
export interface ReferralClientCandidat {
  customer_id: string;
  fullname: string | null;
  phone: string | null;
  /** Son code s'il est déjà parrain. */
  referral_code: string | null;
  /** Code de son parrain s'il est déjà filleul. */
  sponsor_code: string | null;
  has_paid_order: boolean;
}

export interface MarkPaidPayload {
  /** Montant versé : tout le solde payable. */
  amount: number;
  note?: string;
}

/* -------------------------------------------------------------------------- */
/* Pilotage : chiffres et listes filtrées                                     */
/* -------------------------------------------------------------------------- */

export type EtatParrain =
  | "avec_filleuls"
  | "sans_filleul"
  | "qualifies"
  | "en_attente"
  | "payable"
  | "paye";

export type TriParrain =
  | "filleuls"
  | "qualifies"
  | "ventes"
  | "en_attente"
  | "payable"
  | "paye"
  | "dernier_filleul";

export type EtatFilleul = "en_attente" | "a_commande" | "qualifie" | "annule";

export type EtatCadeau = "A_GRATTER" | "GRATTE" | "UTILISE" | "EXPIRE" | "RETIRE";

export interface ReferralCourbePoint {
  /** AAAA-MM-JJ, ou AAAA-MM quand la courbe va au mois. */
  date: string;
  qualifies: number;
  en_attente: number;
  ventes: number;
}

/** Chiffres du programme : filleuls et ventes sur la période, soldes à ce jour. */
export interface ReferralTableau {
  parrains: { codes: number; actifs: number };
  filleuls: {
    inscrits: number;
    ont_commande: number;
    qualifies: number;
    en_attente: number;
    annules: number;
  };
  ventes: { montant: number; commandes: number };
  /** Période précédente de même durée ; `null` sur tout le programme. */
  precedent: { inscrits: number; qualifies: number; ventes: number } | null;
  soldes: {
    en_attente: number;
    parrains_en_attente: number;
    payable: number;
    parrains_payable: number;
    paye: number;
    parrains_paye: number;
    primes: number;
    commissions: number;
    /** Solde en attente à partir duquel un parrain passe en payable. */
    seuil: number;
    parrains_au_seuil: number;
  };
  courbe: { pas: "jour" | "mois"; points: ReferralCourbePoint[] };
}

/** Ligne de la liste de tous les filleuls. */
export interface ReferralFilleulLigne extends AmbassadorFilleul {
  /** `null` pour les filleuls d'avant le cadeau à gratter. */
  gift: EtatCadeau | null;
  referrer_id: string;
  referrer_name: string | null;
  referrer_code: string | null;
}

/** Ligne de la liste de tous les gains. */
export interface ReferralGainLigne extends ReferralEarning {
  referrer_id: string;
  referrer_name: string | null;
  referrer_code: string | null;
  paid_at: string | null;
  note: string | null;
}
