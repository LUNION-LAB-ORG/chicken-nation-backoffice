"use client";

import { useMemo, useCallback } from "react";
import { useOrdersQuery } from "@/hooks/useOrdersQuery";
import { useRBAC } from "@/hooks/useRBAC";
import { useOrderActions } from "../../hooks/useOrderActions";
import { useOrderSelection } from "../../hooks/useOrderSelection";
import { OrdersTableMobile } from "./OrdersTableMobile";
import { OrdersTableDesktop } from "./OrdersTableDesktop";
import { LoadingState, ErrorState } from "./OrdersTableStates";
import { OrdersPaginationInfo } from "./OrdersPaginationInfo";
import { mapApiOrderToUiOrder } from "../../utils/orderMapper";
import { getPaymentStatus } from "../../utils/paymentStatus";
import { Order } from "../../types/ordersTable.types";
import { OrderFilters } from "@/components/gestion/Orders/OrderFilters";
import { User } from "@/services";

export interface OrdersTableProps {
  onViewDetails: (order: Order) => void;
  searchQuery?: string;
  onFilteredOrdersChange?: (orders: Order[]) => void;
  selectedRestaurant?: string | null;
  currentUser?: User;
  filteredOrders?: Order[];
  activeFilter?: string;
  onActiveFilterChange?: (filter: string) => void;
  selectedDate?: Date | null;
  onSelectedDateChange?: (date: Date | null) => void;
}
export function OrdersTable({
  onViewDetails,
  searchQuery = "",
  selectedRestaurant = null,
  currentUser = null,
  activeFilter,
  onActiveFilterChange,
  selectedDate,
  onSelectedDateChange,
}: OrdersTableProps) {
  // Contrôles RBAC
  const {
    canAcceptCommande,
    canRejectCommande,
    canDeleteCommande,
    canUpdateCommande,
  } = useRBAC();

  // Déterminer si on affiche la colonne Actions
  const hasAnyActionPermission =
    canAcceptCommande() ||
    canRejectCommande() ||
    canDeleteCommande() ||
    canUpdateCommande();

  // Utiliser TanStack Query pour les commandes
  const {
    orders: apiOrders,
    totalItems,
    totalPages,
    currentPage,
    isLoading,
    error,
    setCurrentPage,
    refetch,
  } = useOrdersQuery({
    activeFilter: activeFilter || "all",
    selectedRestaurant,
    searchQuery,
    selectedDate: selectedDate || null,
  });

  // Conversion: Mapper les données API vers UI
  const ordersToDisplay = useMemo(() => {
    if (apiOrders.length > 0) {
      return apiOrders.map(mapApiOrderToUiOrder);
    }

    return [];
  }, [apiOrders]);

  // Gestionnaires d'actions
  const {
    handleAcceptOrder,
    handleRejectOrder,
    handleHideOrder,
    handleRemoveOrder,
  } = useOrderActions({ refetch });

  // Gestion de la sélection
  const {
    selectedOrders,
    isAllSelected,
    handleSelectAll,
    handleSelectOrder,
    clearSelection,
    hasSelectionPermission,
  } = useOrderSelection({
    orders: ordersToDisplay,
    canDeleteCommande: canDeleteCommande(),
    canUpdateCommande: canUpdateCommande(),
    searchQuery,
  });

  // Gestion des détails de commande
  const handleViewOrderDetails = useCallback(
    (order: Order) => {
      onViewDetails(order);
    },
    [onViewDetails]
  );

  // Gestion des filtres
  const handleFilterChange = useCallback(
    (filter: string) => {
      onActiveFilterChange?.(filter);
      clearSelection();
    },
    [onActiveFilterChange, clearSelection]
  );

  const handleDateChange = useCallback(
    (date: Date | null) => {
      onSelectedDateChange?.(date);
      clearSelection();
    },
    [onSelectedDateChange, clearSelection]
  );

  // Gestion de la pagination
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      clearSelection();
    },
    [setCurrentPage, clearSelection]
  );

  // Afficher un indicateur de chargement
  if (isLoading && ordersToDisplay.length === 0) {
    return <LoadingState />;
  }

  // Afficher un message d'erreur
  if (error && ordersToDisplay.length === 0) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-w-full bg-white min-h-screen border border-slate-300 p-2 rounded-xl overflow-auto">
      {/* Composant de filtres */}
      <OrderFilters
        activeFilter={activeFilter || "all"}
        onFilterChange={handleFilterChange}
        selectedDate={selectedDate || null}
        onDateChange={handleDateChange}
      />

      <div className="min-w-full mt-4">
        {/* Version mobile */}
        <OrdersTableMobile
          orders={ordersToDisplay}
          selectedOrders={selectedOrders}
          hasSelectionPermission={hasSelectionPermission}
          hasAnyActionPermission={hasAnyActionPermission}
          canAcceptCommande={canAcceptCommande()}
          canRejectCommande={canRejectCommande()}
          canDeleteCommande={canDeleteCommande()}
          onSelectOrder={handleSelectOrder}
          onAcceptOrder={handleAcceptOrder}
          onRejectOrder={handleRejectOrder}
          onViewDetails={handleViewOrderDetails}
          onHideOrder={handleHideOrder}
          onRemoveOrder={handleRemoveOrder}
          getPaymentStatus={getPaymentStatus}
        />

        {/* Version desktop */}
        <OrdersTableDesktop
          orders={ordersToDisplay}
          selectedOrders={selectedOrders}
          isAllSelected={isAllSelected}
          hasSelectionPermission={hasSelectionPermission}
          hasAnyActionPermission={hasAnyActionPermission}
          showRestaurantColumn={!currentUser?.restaurant_id}
          canAcceptCommande={canAcceptCommande()}
          canRejectCommande={canRejectCommande()}
          canDeleteCommande={canDeleteCommande()}
          onSelectAll={handleSelectAll}
          onSelectOrder={handleSelectOrder}
          onAcceptOrder={handleAcceptOrder}
          onRejectOrder={handleRejectOrder}
          onViewDetails={handleViewOrderDetails}
          onHideOrder={handleHideOrder}
          onRemoveOrder={handleRemoveOrder}
          getPaymentStatus={getPaymentStatus}
        />
      </div>

      {/* Pagination et statistiques */}
      <OrdersPaginationInfo
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
