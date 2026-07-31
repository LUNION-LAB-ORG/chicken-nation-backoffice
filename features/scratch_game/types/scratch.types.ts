// Types du moteur "Gratte & Gagne" (scratch) — miroir du contrat backend
// base: /api/v1/fidelity/scratch

export type ScratchRewardType = "POINTS" | "GIFT" | "VOUCHER" | "PROMO_CODE";

/** Niveaux de fidélité (aligné sur points_fedelite). */
export type ScratchLevel = "STANDARD" | "VIP" | "VVIP";

// --- Payloads selon le type de récompense ---

export interface ScratchPayloadPoints {
  points?: number;
}
export interface ScratchPayloadGift {
  dish_id: string;
  label?: string;
  quantity?: number;
}
export interface ScratchPayloadVoucher {
  amount: number;
}
export interface ScratchPayloadPromoCode {
  code: string;
}

export type ScratchPayload =
  | ScratchPayloadPoints
  | ScratchPayloadGift
  | ScratchPayloadVoucher
  | ScratchPayloadPromoCode
  | Record<string, unknown>;

// --- Entité principale ---

export interface ScratchLot {
  id: string;
  label: string;
  reward_type: ScratchRewardType;
  payload: ScratchPayload;
  /** Poids relatif (>= 1) dans le tirage. */
  weight: number;
  /** Coût unitaire estimé du lot (FCFA). */
  unit_cost: number;
  /** Panier minimum requis pour être éligible (FCFA). */
  min_cart: number;
  /** Fidélité requise : commandes payées min. sur la fenêtre (0 = inactif). */
  min_paid_orders: number;
  /** Fidélité requise : CA net min. (FCFA) sur la fenêtre (0 = inactif). L'un des deux suffit. */
  min_revenue: number;
  /** Plafond de fréquence par client (null = illimité). */
  frequency_cap: number | null;
  /** Stock total alloué (null = illimité). */
  stock: number | null;
  /** Stock déjà consommé. */
  stock_used: number;
  /** Niveau minimum requis (null = tous). */
  level_min: ScratchLevel | null;
  /** Lot plancher (POINTS) — non supprimable, toujours en tête. */
  is_floor: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// --- DTO create / update ---

export interface CreateScratchLotDto {
  label: string;
  reward_type: ScratchRewardType;
  payload: ScratchPayload;
  weight?: number;
  unit_cost?: number;
  min_cart?: number;
  min_paid_orders?: number;
  min_revenue?: number;
  frequency_cap?: number | null;
  stock?: number | null;
  level_min?: ScratchLevel | null;
  is_floor?: boolean;
  active?: boolean;
}

export type UpdateScratchLotDto = Partial<CreateScratchLotDto>;

// --- Simulateur ---

export interface ScratchSimulateLot {
  id: string;
  label: string;
  reward_type: ScratchRewardType;
  weight: number;
  /** Poids après application des règles (éligibilité, stock, etc.). */
  effective_weight: number;
  unit_cost: number;
  /** Probabilité de tirage (0..1). */
  probability: number;
  eligible: boolean;
  reason?: string;
}

export interface ScratchSimulateResponse {
  amount: number;
  /** Coût cible pour ce panier (FCFA). */
  target_cost: number;
  /** Coût moyen réalisé attendu (FCFA). */
  realized_avg_cost: number;
  /** Espérance de surcoût (FCFA). */
  expected_cost: number;
  floor: {
    probability: number;
  };
  lots: ScratchSimulateLot[];
}

export interface ScratchSimulateQuery {
  amount: number;
  level?: ScratchLevel;
}

// --- Moniteur d'enveloppe ---

export interface ScratchEnvelopeResponse {
  window_days: number;
  /** Cible d'enveloppe (% du CA). */
  envelope_pct_target: number;
  draws: number;
  gros_lot_draws: number;
  total_cost: number;
  realized_avg_cost: number;
  avg_basket: number;
  /** % réalisé sur la fenêtre. */
  realized_pct: number;
  within_target: boolean;
}

// --- Réglages (Settings scratch.*) ---

export interface ScratchSettings {
  enabled: boolean;
  envelope_pct: string;
  window_days: string;
  floor_weight: string;
}

export const SCRATCH_SETTING_KEYS = {
  enabled: "scratch.enabled",
  envelope_pct: "scratch.envelope_pct",
  window_days: "scratch.window_days",
  floor_weight: "scratch.floor_weight",
} as const;
