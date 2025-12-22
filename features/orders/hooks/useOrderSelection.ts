import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Order } from "../types/ordersTable.types";

interface UseOrderSelectionProps {
  orders: Order[];
  canDeleteCommande: boolean;
  canUpdateCommande: boolean;
  searchQuery?: string;
}

export const useOrderSelection = ({
  orders,
  canDeleteCommande,
  canUpdateCommande,
  searchQuery,
}: UseOrderSelectionProps) => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Vérifier les permissions
  const hasSelectionPermission = canDeleteCommande || canUpdateCommande;

  // Sélectionner/Désélectionner toutes les commandes
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!hasSelectionPermission) {
        toast.error(
          "Vous n'avez pas les permissions pour sélectionner les commandes"
        );
        return;
      }

      if (checked) {
        setSelectedOrders(orders.map((order) => order.id));
      } else {
        setSelectedOrders([]);
      }
    },
    [orders, hasSelectionPermission]
  );

  // Sélectionner/Désélectionner une commande
  const handleSelectOrder = useCallback(
    (orderId: string, checked: boolean) => {
      if (!hasSelectionPermission) {
        toast.error(
          "Vous n'avez pas les permissions pour sélectionner les commandes"
        );
        return;
      }

      if (checked) {
        setSelectedOrders((prev) => [...prev, orderId]);
      } else {
        setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
      }
    },
    [hasSelectionPermission]
  );

  // Vérifier si toutes les commandes sont sélectionnées
  const isAllSelected =
    selectedOrders.length > 0 && selectedOrders.length === orders.length;

  // Vider les sélections quand la recherche change
  useEffect(() => {
    setSelectedOrders([]);
  }, [searchQuery]);

  // Fonction pour vider les sélections manuellement
  const clearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  return {
    selectedOrders,
    isAllSelected,
    handleSelectAll,
    handleSelectOrder,
    clearSelection,
    hasSelectionPermission,
  };
};