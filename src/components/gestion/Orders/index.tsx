"use client";

import { usePendingOrdersSound } from "@/hooks/usePendingOrdersSound";
import { useRBAC } from "@/hooks/useRBAC";
import { updateOrderStatus } from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useState } from "react";
import { toast } from "react-hot-toast";
import AddOrderForm from "../../../../features/orders/components/add-order-form";
import OrderDetails from "../../../../features/orders/components/detail-order";
import { OrdersTable } from "../../../../features/orders/components/list-order";
import { Order } from "../../../../features/orders/types/ordersTable.types";
import OrderHeader from "./OrderHeader";
import RestaurantTabs from "./RestaurantTabs";
import {
  UserType,
} from "../../../../features/users/types/user.types";

export default function Orders() {
  const { user: currentUser } = useAuthStore();

  const { canCreateCommande, canAcceptCommande, canRejectCommande } = useRBAC();

  const {
    orders: { view, selectedItem },
    setSectionView,
    setSelectedItem,
  } = useDashboardStore();

  // États pour la recherche locale
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ✅ États pour les filtres (synchronisés avec OrdersTable) - Par défaut afficher les nouvelles commandes
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // ✅ État du restaurant sélectionné et filtrage
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(
    null
  );

  // ✅ Hook pour le son continu des commandes en attente
  const { hasPendingOrders, isPlaying, pendingOrdersCount } =
    usePendingOrdersSound({
      activeFilter: "nouvelle", // Utiliser 'nouvelle' pour les commandes PENDING
      selectedRestaurant: selectedRestaurant || undefined,
      disabledSound: true, // Toujours activé pour l'instant
    });

  const handleViewChange = (newView: "list" | "create" | "edit" | "view") => {
    setSectionView("orders", newView);
  };

  // Fonction de recherche locale
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedItem("orders", order);
    setSectionView("orders", "view");
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!canAcceptCommande()) {
      toast.error(
        "Vous n'avez pas les permissions pour accepter les commandes"
      );
      return;
    }

    try {
      await updateOrderStatus(orderId, "ACCEPTED");
      toast.success(`Commande acceptée`);
      // ✅ OrdersTable gère le refresh automatiquement via TanStack Query
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error
            ? error.message
            : "Impossible d'accepter la commande"
        }`
      );
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!canRejectCommande()) {
      toast.error("Vous n'avez pas les permissions pour refuser les commandes");
      return;
    }

    try {
      await updateOrderStatus(orderId, "CANCELLED");
      toast.success(`Commande refusée`);
      // ✅ OrdersTable gère le refresh automatiquement via TanStack Query
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error
            ? error.message
            : "Impossible de refuser la commande"
        }`
      );
    }
  };

  // ✅ Fonction pour gérer les changements de statut - OrdersTable gère maintenant le refresh
  const handleStatusChange = async () => {
    // ✅ OrdersTable gère le refresh automatiquement via TanStack Query
  };

  return (
    <div className="flex-1 p-4">
      <OrderHeader
        currentView={view}
        onBack={() => handleViewChange("list")}
        onCreateOrder={() => handleViewChange("create")}
        onSearch={handleSearch}
        activeFilter={activeFilter}
        selectedRestaurant={selectedRestaurant}
        searchQuery={searchQuery}
        selectedDate={selectedDate}
        hasPendingOrders={hasPendingOrders}
        pendingOrdersCount={pendingOrdersCount}
        isSoundPlaying={isPlaying}
      />
      {view === "list" && (
        <div>
          {/* ✅ Tabs Restaurant - Au-dessus des filtres existants */}
          <RestaurantTabs
            selectedRestaurant={selectedRestaurant}
            onSelectRestaurant={setSelectedRestaurant}
            showAllTab={currentUser?.type == UserType.BACKOFFICE} // Seulement pour ADMIN
          />

          <OrdersTable
            onViewDetails={handleViewOrderDetails}
            searchQuery={searchQuery}
            selectedRestaurant={selectedRestaurant} // ✅ Filtre par restaurant
            currentUser={currentUser} // Typage sécurisé
            activeFilter={activeFilter}
            onActiveFilterChange={setActiveFilter}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
          />
        </div>
      )}

      {view === "view" && selectedItem && (
        <OrderDetails
          order={selectedItem}
          onAccept={handleAcceptOrder}
          onReject={handleRejectOrder}
          onStatusChange={handleStatusChange}
        />
      )}

      {view === "create" && canCreateCommande() && <AddOrderForm />}
    </div>
  );
}
