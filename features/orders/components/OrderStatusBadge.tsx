import { OrderTableStatus } from "../types/ordersTable.types";

export const OrderStatusBadge = ({ status }: { status: OrderTableStatus }) => {
  const styles = {
    NOUVELLE: "text-[#007AFF]",
    "EN COURS": "text-[#F5A524]",
    "EN PRÉPARATION": "text-[#F5A524]",
    LIVRÉ: "text-[#17C964]",
    COLLECTÉ: "text-[#17C964]",
    ANNULÉE: "text-[#090909]",
    LIVRAISON: "text-red-600",
    PRÊT: "text-[#17C964]",
    TERMINÉ: "text-[#17C964]",
  };

  return (
    <span className={`font-medium text-sm ${styles[status]}`}>{status}</span>
  );
};
