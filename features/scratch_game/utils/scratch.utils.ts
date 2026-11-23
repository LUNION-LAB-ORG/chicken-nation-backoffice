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
  POINTS: "bg-hex-eef1f4 text-hex-6c757d",
  GIFT: "bg-hex-fff6e9 text-hex-b25a00",
  VOUCHER: "bg-hex-e7f0fb text-hex-2b6cb0",
  PROMO_CODE: "bg-hex-f3e8ff text-[#7C3AED]",
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
