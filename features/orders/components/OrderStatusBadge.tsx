import { OrderTableStatus } from "../types/ordersTable.types";

export const OrderStatusBadge = ({ status }: { status: OrderTableStatus }) => {
  const styles: Record<OrderTableStatus, string> = {
    "EN ATTENTE": "text-[#007AFF]",
    "NOUVELLE": "text-[#007AFF]",
    "EN PRÉPARATION": "text-[#F5A524]",
    "PRÊT": "text-[#17C964]",
    "EN LIVRAISON": "text-[#F5A524]",
    "RÉCUPÉRÉE": "text-[#17C964]",
    "ANNULÉE": "text-[#090909]",
    "TERMINÉE": "text-[#17C964]",
  };

  return (
    <span className={`font-medium text-sm ${styles[status]}`}>{status}</span>
  );
};
