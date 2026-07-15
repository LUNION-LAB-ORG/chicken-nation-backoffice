import { ScratchRewardType } from "../types/scratch.types";

export const money = (n: number) =>
  `${Math.round(n || 0).toLocaleString("fr-FR")} FCFA`;

export const pctFmt = (n: number, digits = 1) =>
  `${(Number.isFinite(n) ? n : 0).toFixed(digits)} %`;

/** Formate une probabilité 0..1 en pourcentage. */
export const probaFmt = (p: number, digits = 1) =>
  `${((Number.isFinite(p) ? p : 0) * 100).toFixed(digits)} %`;

export const REWARD_TYPE_LABEL: Record<ScratchRewardType, string> = {
  POINTS: "Points",
  GIFT: "Cadeau (plat)",
  VOUCHER: "Bon d'achat",
  PROMO_CODE: "Code promo",
};

export const REWARD_TYPE_BADGE: Record<ScratchRewardType, string> = {
  POINTS: "bg-[#EEF1F4] text-[#6C757D]",
  GIFT: "bg-[#FFF6E9] text-[#B25A00]",
  VOUCHER: "bg-[#E7F0FB] text-[#2B6CB0]",
  PROMO_CODE: "bg-[#F3E8FF] text-[#7C3AED]",
};

export const LEVEL_LABEL: Record<string, string> = {
  STANDARD: "Standard",
  VIP: "VIP",
  VVIP: "VVIP",
};

/** Rend le payload lisible pour l'affichage en tableau. */
export const describePayload = (
  reward_type: ScratchRewardType,
  payload: Record<string, unknown> | undefined | null
): string => {
  if (!payload) return "—";
  switch (reward_type) {
    case "POINTS":
      return payload.points != null ? `${payload.points} pts` : "Points";
    case "GIFT":
      return (
        (payload.label as string) ||
        (payload.dish_id ? `Plat ${String(payload.dish_id).slice(0, 8)}…` : "Plat") +
          (payload.quantity ? ` ×${payload.quantity}` : "")
      );
    case "VOUCHER":
      return payload.amount != null ? money(Number(payload.amount)) : "Bon";
    case "PROMO_CODE":
      return (payload.code as string) || "Code promo";
    default:
      return "—";
  }
};
