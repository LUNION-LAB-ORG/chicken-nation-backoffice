import { useState, useCallback, useEffect, useMemo } from "react";
import { Order } from "../types/ordersTable.types";
import { useDashboardStore } from "@/store/dashboardStore";

interface UseOrderSelectionProps {
  orders: Order[];
}

export const useOrderSelection = ({
  orders,
}: UseOrderSelectionProps) => {
  const { orders: { filters, pagination } } = useDashboardStore();

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Sélectionner/Désélectionner toutes les commandes
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedOrders(checked ? orders.map((order) => order.id) : []);
    },
    [orders]
  );

  // Sélectionner/Désélectionner une commande
  const handleSelectOrder = useCallback(
    (orderId: string, checked: boolean) => {
      setSelectedOrders((prev) =>
        checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
      );
    },
    [orders]
  );

  // Mémoriser le calcul de isAllSelected
  const isAllSelected = useMemo(
    () => orders.length > 0 && selectedOrders.length === orders.length,
    [selectedOrders.length, orders.length]
  );

  // Vider les sélections
  const clearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  // Effet unique pour vider les sélections lors des changements
  useEffect(() => {
    clearSelection();
  }, [filters?.active_filter, filters?.date, filters?.search, pagination.page, pagination.limit, clearSelection]);

  return {
    selectedOrders,
    isAllSelected,
    handleSelectAll,
    handleSelectOrder,
    clearSelection,
  };
};