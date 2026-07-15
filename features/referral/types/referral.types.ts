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
  /** Nombre total de filleuls rattachés. */
  referees_count: number;
  /** Filleuls ayant passé leur 1re commande qualifiante. */
  qualified_referees_count: number;
  /** Chiffre d'affaires généré par les filleuls dans les fenêtres (FCFA). */
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

/** Détail d'un ambassadeur (soldes + gains + historique versements). */
export interface AmbassadorDetail extends Ambassador {
  earnings: ReferralEarning[];
  payouts: ReferralPayout[];
}

export interface MarkPaidPayload {
  /** Montant versé (défaut = solde payable courant). */
  amount: number;
  note?: string;
}
