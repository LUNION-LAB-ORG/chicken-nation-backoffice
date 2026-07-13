export type RewardCampaignType = "GIFT" | "VOUCHER" | "PROMO_CODE";

export type LoyaltyLevel = "STANDARD" | "PREMIUM" | "GOLD";

export type RewardCampaignStatus =
  | "scheduled"
  | "sending"
  | "sent"
  | "cancelled"
  | "failed";

/** Contenu-modèle selon le type. */
export interface RewardCampaignPayload {
  // GIFT
  label?: string;
  image?: string;
  // VOUCHER
  amount?: number;
  // PROMO_CODE (snapshot serveur)
  code?: string;
  discount_type?: string;
  discount_value?: number;
  description?: string;
}

export interface CreateRewardCampaignPayload {
  name: string;
  type: RewardCampaignType;
  payload: RewardCampaignPayload;
  target_type: "all" | "ids";
  ids?: string[];
  loyalty_level?: LoyaltyLevel;
  scheduled_at?: string; // ISO
  expires_at?: string; // ISO
  /** Envoyer même aux clients récemment sollicités (contourne le capping). */
  ignore_capping?: boolean;
}

export interface RewardCampaign {
  id: string;
  name: string;
  type: RewardCampaignType;
  payload: RewardCampaignPayload;
  target_type: "all" | "ids";
  target_config: {
    ids?: string[];
    loyalty_level?: LoyaltyLevel;
    ignore_capping?: boolean;
    /** Clients retirés par le capping anti-fatigue à l'envoi. */
    skipped_capping?: number;
  };
  expires_at: string | null;
  total_targeted: number;
  scratched_count: number;
  /** Funnel d'impact — `null` = non suivi (GIFT). */
  redeemed_count: number | null;
  revenue: number | null;
  discount_cost: number | null;
  status: RewardCampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}
