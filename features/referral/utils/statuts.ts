import { EtatCadeau, ReferralEarningStatus, ReferralStatus } from "../types/referral.types";

type Style = { label: string; cls: string };

/** Statut d'un gain. */
export const STATUT_GAIN: Record<ReferralEarningStatus, Style> = {
  PENDING: { label: "En attente", cls: "bg-hex-fff6e9 text-hex-b45309" },
  PAYABLE: { label: "Payable", cls: "bg-hex-eaf6ff text-hex-0369a1" },
  PAID: { label: "Payé", cls: "bg-hex-e7f7ee text-hex-1e8e5a" },
  CANCELLED: { label: "Annulé", cls: "bg-hex-f3f3f3 text-hex-71717a" },
};

/** Statut d'un filleul. */
export const STATUT_FILLEUL: Record<ReferralStatus, Style> = {
  PENDING: { label: "En attente", cls: "bg-hex-fff6e9 text-hex-b45309" },
  REWARDED: { label: "Qualifié", cls: "bg-hex-e7f7ee text-hex-1e8e5a" },
  CANCELLED: { label: "Annulé", cls: "bg-hex-f3f3f3 text-hex-71717a" },
};

/** Où en est le cadeau du filleul. */
export const ETAT_CADEAU: Record<EtatCadeau, Style> = {
  A_GRATTER: { label: "À gratter", cls: "bg-hex-fff6e9 text-hex-b45309" },
  GRATTE: { label: "Gratté", cls: "bg-hex-eaf6ff text-hex-0369a1" },
  UTILISE: { label: "Utilisé", cls: "bg-hex-e7f7ee text-hex-1e8e5a" },
  EXPIRE: { label: "Expiré", cls: "bg-hex-f3f3f3 text-hex-71717a" },
  RETIRE: { label: "Retiré", cls: "bg-hex-f3f3f3 text-hex-71717a" },
};
