import {
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { OrderStatus, OrderType } from "../../orders/types/order.types";

/**
 * Couleurs & libellés des badges de la page Opérations — **aligné sur les
 * composants `OrderStatusBadge` et `OrderTypeBadge` de la page Commandes**
 * pour assurer une cohérence visuelle entre les deux vues. Tout nouveau badge
 * statut/type doit passer par ces helpers.
 */

// ─── Statut ────────────────────────────────────────────────────────────────

/**
 * Classes Tailwind d'un chip statut. La **couleur texte reprend le hex exact**
 * de `OrderStatusBadge.tsx` (#007AFF / #F5A524 / #17C964 / #090909) ; on ajoute
 * un fond clair + bordure colorée pour le rendu chip avec `border-2`.
 */
export function getStatusBadgeClasses(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.ACCEPTED: // NOUVELLE → bleu
      return "bg-blue-50 text-[#007AFF] border-[#007AFF]/30";
    case OrderStatus.PENDING:
    case OrderStatus.IN_PROGRESS: // EN PRÉPARATION → ambre
      return "bg-amber-50 text-[#F5A524] border-[#F5A524]/30";
    case OrderStatus.READY: // PRÊT → vert
    case OrderStatus.PICKED_UP: // COLLECTÉE → vert
    case OrderStatus.COLLECTED: // LIVRÉE → vert
    case OrderStatus.COMPLETED: // TERMINÉE → vert
      return "bg-green-50 text-[#17C964] border-[#17C964]/30";
    case OrderStatus.CANCELLED: // ANNULÉE → noir/gris
      return "bg-gray-100 text-[#090909] border-gray-300";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

// ─── Type de commande ──────────────────────────────────────────────────────

export interface ITypeMeta {
  label: string;
  Icon: LucideIcon;
  /** Classes Tailwind complètes pour un chip (bg + text + border) */
  cls: string;
}

/**
 * Métadonnées d'un badge type — libellé et couleurs reprennent **exactement**
 * ce que `OrderTypeBadge.tsx` affiche sur la page Commandes :
 *   DELIVERY → « À livrer »     · fond orange clair (#FBDBA7) · texte gris (#71717A)
 *   PICKUP   → « À récupérer » · fond violet (#C9A9E9) · texte blanc
 *   TABLE    → « À table »      · fond bleu clair (#CCE3FD) · texte gris (#71717A)
 *
 * Les icônes sont en Lucide pour rester homogènes avec le reste du module
 * Opérations (plutôt que les PNG `/icons/deliver.png` utilisés côté Commandes).
 */
export function getTypeMeta(type: OrderType): ITypeMeta {
  switch (type) {
    case OrderType.DELIVERY:
      return {
        label: "À livrer",
        Icon: Truck,
        cls: "bg-[#FBDBA7] text-[#71717A] border-[#F5A524]/40",
      };
    case OrderType.PICKUP:
      return {
        label: "À récupérer",
        Icon: ShoppingBag,
        cls: "bg-[#C9A9E9] text-white border-[#C9A9E9]",
      };
    case OrderType.TABLE:
      return {
        label: "À table",
        Icon: UtensilsCrossed,
        cls: "bg-[#CCE3FD] text-[#71717A] border-blue-300/40",
      };
  }
}

/** Libellé seul pour les contextes text-only (header drawer par ex.). */
export const TYPE_LABEL: Record<OrderType, string> = {
  [OrderType.DELIVERY]: "À livrer",
  [OrderType.PICKUP]: "À récupérer",
  [OrderType.TABLE]: "À table",
};
