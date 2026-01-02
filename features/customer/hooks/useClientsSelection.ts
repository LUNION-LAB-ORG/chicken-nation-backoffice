import { useState, useCallback, useEffect, useMemo } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { Customer } from "../types/customer.types";

interface UseClientsSelectionProps {
  clients: Customer[];
}

export const useClientsSelection = ({
  clients,
}: UseClientsSelectionProps) => {
  const { clients: { filters, pagination } } = useDashboardStore();

  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Sélectionner/Désélectionner toutes les commandes
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedClients(checked ? clients.map((client) => client.id) : []);
    },
    [clients]
  );

  // Sélectionner/Désélectionner une commande
  const handleSelectClient = useCallback(
    (orderId: string, checked: boolean) => {
      setSelectedClients((prev) =>
        checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
      );
    },
    [clients]
  );

  // Mémoriser le calcul de isAllSelected
  const isAllSelected = useMemo(
    () => clients.length > 0 && selectedClients.length === clients.length,
    [selectedClients.length, clients.length]
  );

  // Vider les sélections
  const clearSelection = useCallback(() => {
    setSelectedClients([]);
  }, []);

  // Effet unique pour vider les sélections lors des changements
  useEffect(() => {
    clearSelection();
  }, [filters?.active_filter, filters?.date, filters?.search, pagination.page, pagination.limit, clearSelection]);

  return {
    selectedClients,
    isAllSelected,
    handleSelectAll,
    handleSelectClient,
    clearSelection,
  };
};