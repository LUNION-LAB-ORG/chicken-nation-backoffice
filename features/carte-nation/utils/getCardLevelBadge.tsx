import { Crown, GraduationCap, Star } from "lucide-react";
import { CardLevel, CardRequest, NationCard } from "../types/carte-nation.types";

/**
 * Thème couleur par niveau de carte (4 designs générés PAR COULEUR).
 * Standard = orange, VIP = or, VVIP = rouge.
 * Le marqueur ÉTUDIANT (jaune #FFD24C) se superpose, indépendant du niveau.
 */
export const CARD_LEVEL_THEME: Record<
  CardLevel,
  { label: string; color: string; bg: string; text: string; border: string }
> = {
  STANDARD: {
    label: "Standard",
    color: "#F17922",
    bg: "#FDEBDD",
    text: "#B4560F",
    border: "#F5B588",
  },
  VIP: {
    label: "VIP",
    color: "#D4AF37",
    bg: "#FBF3D9",
    text: "#8A6D0B",
    border: "#E6CF7E",
  },
  VVIP: {
    label: "VVIP",
    color: "#C0392B",
    bg: "#FBE3E0",
    text: "#922017",
    border: "#E39A92",
  },
};

/** Couleur du marqueur ÉTUDIANT (liseré / badge jaune). */
export const STUDENT_MARKER_COLOR = "#FFD24C";

/**
 * Résout le niveau à afficher pour une carte/demande.
 * Priorité au champ `level` porté par l'entité, sinon niveau de fidélité du client.
 */
export const resolveCardLevel = (
  entity?: NationCard | CardRequest | null
): CardLevel => {
  if (!entity) return "STANDARD";
  if (entity.level) return entity.level;
  const customerLevel = entity.customer?.loyalty_level;
  if (customerLevel === "VIP" || customerLevel === "VVIP") return customerLevel;
  return "STANDARD";
};

/** Un client est-il déclaré ÉTUDIANT (marqueur indépendant du niveau) ? */
export const isStudentProfile = (
  entity?: NationCard | CardRequest | null
): boolean => {
  if (!entity) return false;
  if (typeof entity.is_student === "boolean") return entity.is_student;
  const asRequest = entity as CardRequest;
  if (asRequest.profile_type) return asRequest.profile_type === "STUDENT";
  return false;
};

interface CardLevelBadgeProps {
  level: CardLevel;
  size?: "sm" | "md";
}

/** Badge coloré du niveau (Standard / VIP / VVIP). */
export const CardLevelBadge = ({ level, size = "md" }: CardLevelBadgeProps) => {
  const theme = CARD_LEVEL_THEME[level] ?? CARD_LEVEL_THEME.STANDARD;
  const Icon = level === "VVIP" ? Crown : level === "VIP" ? Star : null;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${pad}`}
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
      }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {theme.label}
    </span>
  );
};

interface StudentMarkerBadgeProps {
  size?: "sm" | "md";
}

/** Badge jaune du marqueur ÉTUDIANT. */
export const StudentMarkerBadge = ({ size = "md" }: StudentMarkerBadgeProps) => {
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${pad}`}
      style={{
        backgroundColor: STUDENT_MARKER_COLOR,
        color: "#5A4300",
        border: "1px solid #E6B800",
      }}
    >
      <GraduationCap className="w-3 h-3" />
      Étudiant
    </span>
  );
};

/** Libellé du profil déclaratif. */
export const getProfileTypeLabel = (
  profile?: CardRequest["profile_type"]
): string => {
  switch (profile) {
    case "STUDENT":
      return "Étudiant";
    case "PROFESSIONAL":
      return "Professionnel";
    default:
      return "—";
  }
};
