import { ProspectPlatform } from "../types/prospect.types";

export const PLATFORM_META: Record<
  ProspectPlatform,
  { label: string; emoji: string; className: string }
> = {
  GLOVO: { label: "Glovo", emoji: "🛵", className: "bg-[#FFC244] text-[#7a5a00]" },
  YANGO: { label: "Yango", emoji: "🚕", className: "bg-[#FFE9E7] text-[#FF3B30]" },
  APP_ORGANIC: { label: "Organique", emoji: "📱", className: "bg-[#DCFCE7] text-[#166534]" },
};
