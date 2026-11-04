import { EtatCadeau, ReferralEarningStatus, ReferralStatus } from "../types/referral.types";

type Style = { label: string; cls: string };

/** Statut d'un gain. */
export const STATUT_GAIN: Record<ReferralEarningStatus, Style> = {
  PENDING: { label: "En attente", cls: "bg-[#FFF6E9] text-[#B45309]" },
  PAYABLE: { label: "Payable", cls: "bg-[#EAF6FF] text-[#0369A1]" },
  PAID: { label: "Payé", cls: "bg-[#E7F7EE] text-[#1E8E5A]" },
  CANCELLED: { label: "Annulé", cls: "bg-[#F3F3F3] text-[#71717A]" },
};

/** Statut d'un filleul. */
export const STATUT_FILLEUL: Record<ReferralStatus, Style> = {
  PENDING: { label: "En attente", cls: "bg-[#FFF6E9] text-[#B45309]" },
  REWARDED: { label: "Qualifié", cls: "bg-[#E7F7EE] text-[#1E8E5A]" },
  CANCELLED: { label: "Annulé", cls: "bg-[#F3F3F3] text-[#71717A]" },
};

/** Où en est le cadeau du filleul. */
export const ETAT_CADEAU: Record<EtatCadeau, Style> = {
  A_GRATTER: { label: "À gratter", cls: "bg-[#FFF6E9] text-[#B45309]" },
  GRATTE: { label: "Gratté", cls: "bg-[#EAF6FF] text-[#0369A1]" },
  UTILISE: { label: "Utilisé", cls: "bg-[#E7F7EE] text-[#1E8E5A]" },
  EXPIRE: { label: "Expiré", cls: "bg-[#F3F3F3] text-[#71717A]" },
  RETIRE: { label: "Retiré", cls: "bg-[#F3F3F3] text-[#71717A]" },
};
