import { ProspectPlatform } from "../types/prospect.types";

export const PLATFORM_META: Record<
  ProspectPlatform,
  { label: string; emoji: string; className: string }
> = {
  GLOVO: { label: "Glovo", emoji: "🛵", className: "bg-[#FFC244] text-hex-7a5a00 dark:text-[#7a5a00]" },
  YANGO: { label: "Yango", emoji: "🚕", className: "bg-hex-ffe9e7 text-[#FF3B30]" },
  APP_ORGANIC: { label: "Organique", emoji: "📱", className: "bg-hex-dcfce7 text-hex-166534" },
};
