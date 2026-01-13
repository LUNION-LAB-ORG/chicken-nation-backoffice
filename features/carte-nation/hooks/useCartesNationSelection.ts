import { useState, useCallback, useEffect, useMemo } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { NationCard } from "../types/carte-nation.types";

interface UseCartesNationSelectionProps {
  cartesNation: NationCard[];
}

export const useCartesNationSelection = ({
  cartesNation,
}: UseCartesNationSelectionProps) => {
  const { clients: { filters, pagination } } = useDashboardStore();

  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Sélectionner/Désélectionner toutes les commandes
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedClients(checked ? cartesNation.map((carte) => carte.id) : []);
    },
    [cartesNation]
  );

  // Sélectionner/Désélectionner une commande
  const handleSelectClient = useCallback(
    (carteId: string, checked: boolean) => {
      setSelectedClients((prev) =>
        checked ? [...prev, carteId] : prev.filter((id) => id !== carteId)
      );
    },
    [cartesNation]
  );

  // Mémoriser le calcul de isAllSelected
  const isAllSelected = useMemo(
    () => cartesNation.length > 0 && selectedClients.length === cartesNation.length,
    [selectedClients.length, cartesNation.length]
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