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

export interface ReferralConfig {
  welcome_amount: number;
  parrain: ReferralParrainReward;
  created_by: string | null;
}

export interface SetReferralConfigPayload {
  welcome_amount?: number;
  parrain?: ReferralParrainReward;
  created_by?: string | null;
}
