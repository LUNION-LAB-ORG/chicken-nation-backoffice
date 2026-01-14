import { LoyaltyLevel, LoyaltyPointType } from "../types/loyalty.types";

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
  };
  return badges[type] || null;
};

// Badge pour le statut d'utilisation
export const getIsUsedBadge = (points: number, points_used: number) => {
  const isUsed = points === points_used;
  const isPartial = points > points_used;

  if (isUsed) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Utilisé
      </span>
    );
  }
  if (isPartial) {
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

// Badge pour le niveau de fidélité
export const getLoyaltyLevelBadge = (level: LoyaltyLevel) => {
  const badges = {
    STANDARD: (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <span className="mr-1">⭐</span> Standard
      </span>
    ),
    PREMIUM: (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <span className="mr-1">⭐⭐</span> Premium
      </span>
    ),
    GOLD: (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <span className="mr-1">⭐⭐⭐</span> Gold
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
