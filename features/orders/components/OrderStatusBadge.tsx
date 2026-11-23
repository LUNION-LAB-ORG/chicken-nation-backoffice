import { OrderTableStatus } from "../types/ordersTable.types";

export const OrderStatusBadge = ({ status }: { status: OrderTableStatus }) => {
  const styles: Record<OrderTableStatus, string> = {
    "EN ATTENTE": "text-[#007AFF]",
    "NOUVELLE": "text-[#007AFF]",
    "EN PRÉPARATION": "text-[#F5A524]",
    "PRÊT": "text-hex-17c964",
    "EN LIVRAISON": "text-[#F5A524]",
    "RÉCUPÉRÉE": "text-hex-17c964",
    "ANNULÉE": "text-hex-090909",
    "TERMINÉE": "text-hex-17c964",
  };

  return (
    <span className={`font-medium text-sm ${styles[status]}`}>{status}</span>
  );
};
