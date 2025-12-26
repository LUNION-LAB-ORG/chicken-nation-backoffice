import { OrderTableStatus } from "../types/ordersTable.types";

export const OrderStatusBadge = ({ status }: { status: OrderTableStatus }) => {
  const styles = {
    [OrderTableStatus["NOUVELLE"]]: "text-[#007AFF]",
    [OrderTableStatus["EN COURS"]]: "text-[#F5A524]",
    [OrderTableStatus["EN PRÉPARATION"]]: "text-[#F5A524]",
    [OrderTableStatus["LIVRÉ"]]: "text-[#17C964]",
    [OrderTableStatus["COLLECTÉ"]]: "text-[#17C964]",
    [OrderTableStatus["ANNULÉE"]]: "text-[#090909]",
    [OrderTableStatus["LIVRAISON"]]: "text-red-600",
    [OrderTableStatus["PRÊT"]]: "text-[#17C964]",
    [OrderTableStatus["TERMINÉ"]]: "text-[#17C964]",
  };

  return (
    <span className={`font-medium text-sm ${styles[status]}`}>
      {OrderTableStatus[status]}
    </span>
  );
};
