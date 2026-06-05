import { ProspectPlatform, ProspectStatus } from "../types/prospect.types";

export const STATUS_META: Record<
  ProspectStatus,
  { label: string; text: string; bg: string; dot: string }
> = {
  NOUVEAU: { label: "Nouveau", text: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400" },
  A_APPELER: { label: "À appeler", text: "text-blue-700", bg: "bg-blue-100", dot: "bg-blue-500" },
  JOINT: { label: "Joint / Vérifié", text: "text-violet-700", bg: "bg-violet-100", dot: "bg-violet-500" },
  NON_JOIGNABLE: { label: "Non joignable", text: "text-orange-700", bg: "bg-orange-100", dot: "bg-orange-500" },
  REFUS: { label: "Refus", text: "text-red-700", bg: "bg-red-100", dot: "bg-red-500" },
  COUPON_ENVOYE: { label: "Coupon envoyé", text: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-500" },
  INSCRIT: { label: "Inscrit", text: "text-green-700", bg: "bg-green-100", dot: "bg-green-500" },
  CONVERTI: { label: "Converti", text: "text-emerald-800", bg: "bg-emerald-100", dot: "bg-emerald-600" },
};

export const PLATFORM_META: Record<
  ProspectPlatform,
  { label: string; emoji: string; className: string }
> = {
  GLOVO: { label: "Glovo", emoji: "🛵", className: "bg-[#FFC244] text-[#7a5a00]" },
  YANGO: { label: "Yango", emoji: "🚕", className: "bg-[#FFE9E7] text-[#FF3B30]" },
};

export const PROSPECT_STATUSES: ProspectStatus[] = [
  "NOUVEAU",
  "A_APPELER",
  "JOINT",
  "NON_JOIGNABLE",
  "REFUS",
  "COUPON_ENVOYE",
  "INSCRIT",
  "CONVERTI",
];
