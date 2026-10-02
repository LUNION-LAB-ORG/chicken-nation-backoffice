import { Undo2 } from "lucide-react";
import {
  LoyaltyLevel,
  LoyaltyPoint,
  LoyaltyPointType,
} from "../types/loyalty.types";

// Badge pour le type de point
export const getPointTypeBadge = (type: LoyaltyPointType) => {
  const badges = {
    EARNED: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Gagné
      </span>
    ),
    REDEEMED: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Utilisé
      </span>
    ),
    EXPIRED: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Expiré
      </span>
    ),
    BONUS: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        Bonus
      </span>
    ),
    // Points d'une commande annulée rendus au client : un crédit, en vert,
    // distinct des points gagnés.
    REFUNDED: (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
        <Undo2 className="w-3 h-3" aria-hidden="true" />
        Rendus
      </span>
    ),
  };
  return badges[type] || null;
};

// Lignes qui CRÉDITENT des points que le client peut dépenser : le pendant de
// TYPES_POINTS_DEPENSABLES côté serveur (helpers/points-commande.rules.ts).
// Seules ces lignes se consomment ; les autres (REDEEMED, EXPIRED) sont des
// sorties de points, déjà closes, sans disponibilité à montrer.
export const TYPES_POINTS_CREDITES: readonly LoyaltyPointType[] = [
  "EARNED",
  "BONUS",
  "REFUNDED",
];

export type StatutDisponibilite = "DISPONIBLE" | "PARTIEL" | "UTILISE";

type LigneStatut = Pick<LoyaltyPoint, "type" | "points" | "points_used" | "is_used">;

// Où en est la consommation d'une ligne de crédit ; null pour une sortie de
// points. On lit l'état tenu par le serveur (is_used), celui des filtres de la
// liste : il ferme seul certaines lignes sans toucher à points_used (points
// rendus arrivés à expiration). Les nombres le complètent quand la réponse ne
// le porte pas : rien de consommé, la ligne est disponible ; une part, elle
// est partielle ; tout, elle est utilisée.
export const statutDisponibilite = (
  point: LigneStatut,
): StatutDisponibilite | null => {
  if (!TYPES_POINTS_CREDITES.includes(point.type)) return null;

  const utilises = point.points_used || 0;
  if (point.is_used === "YES" || utilises >= point.points) return "UTILISE";
  if (point.is_used === "PARTIAL" || utilises > 0) return "PARTIEL";
  return "DISPONIBLE";
};

// Badge pour le statut d'utilisation (null pour une sortie de points)
export const getIsUsedBadge = (point: LigneStatut) => {
  const statut = statutDisponibilite(point);

  if (statut === null) return null;
  if (statut === "UTILISE") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Utilisé
      </span>
    );
  }
  if (statut === "PARTIEL") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        Partiel
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Disponible
    </span>
  );
};

// Libellé humain d'un niveau de fidélité (Standard / VIP / VVIP)
export const LOYALTY_LEVEL_LABELS: Record<LoyaltyLevel, string> = {
  STANDARD: "Standard",
  VIP: "VIP",
  VVIP: "VVIP",
};

export const getLoyaltyLevelLabel = (level: LoyaltyLevel | string | null | undefined) =>
  (level && LOYALTY_LEVEL_LABELS[level as LoyaltyLevel]) || level || "Standard";

// Badge pour le niveau de fidélité
export const getLoyaltyLevelBadge = (level: LoyaltyLevel) => {
  const badges = {
    STANDARD: (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <span className="mr-1">⭐</span> Standard
      </span>
    ),
    VIP: (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <span className="mr-1">⭐⭐</span> VIP
      </span>
    ),
    VVIP: (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <span className="mr-1">⭐⭐⭐</span> VVIP
      </span>
    ),
  };
  return badges[level] || null;
};

// Formater les points
export const formatPoints = (points: number) => {
  return new Intl.NumberFormat("fr-FR").format(points);
};

// Formater le montant en XOF
export const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
};
