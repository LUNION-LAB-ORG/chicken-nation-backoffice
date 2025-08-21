"use client";

import { useState, useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";
import { OrdersTable, Order } from "./OrdersTable";
import OrderHeader from "./OrderHeader";
import RestaurantTabs from "./RestaurantTabs";
import AddMenu from "../Menus/AddMenu";
import OrderDetails from "./OrderDetails";
import { getAllRestaurants, Restaurant } from "@/services/restaurantService";
import { updateOrderStatus } from "@/services/orderService";
import { toast } from "react-hot-toast";
import { useRBAC } from "@/hooks/useRBAC";
import { usePendingOrdersSound } from "@/hooks/usePendingOrdersSound";

export default function Orders() {
  const { user: currentUser } = useAuthStore();
  const { canAcceptCommande, canRejectCommande, canCreatePlat } = useRBAC();
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

  // ✅ États pour les restaurants et filtrage
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // ✅ Hook pour le son continu des commandes en attente
  const { hasPendingOrders, isPlaying, pendingOrdersCount } =
    usePendingOrdersSound({
      activeFilter: "nouvelle", // Utiliser 'nouvelle' pour les commandes PENDING
      selectedRestaurant: selectedRestaurant || undefined,
      disabledSound: true, // Toujours activé pour l'instant
    });

  // ✅ Récupération des restaurants et gestion des permissions
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const restaurantData = await getAllRestaurants();
        const activeRestaurants = restaurantData.filter(
          (restaurant) => restaurant.active
        );

        // ✅ Filtrer les restaurants selon les permissions
        let filteredRestaurants = activeRestaurants;

        if (currentUser?.role === "MANAGER" && currentUser?.restaurant_id) {
          // Manager : seulement son restaurant
          filteredRestaurants = activeRestaurants.filter(
            (restaurant) => restaurant.id === currentUser.restaurant_id
          );
          setSelectedRestaurant(currentUser.restaurant_id);
        } else if (currentUser?.restaurant_id) {
          // Utilisateur restaurant : seulement son restaurant
          filteredRestaurants = activeRestaurants.filter(
            (restaurant) => restaurant.id === currentUser.restaurant_id
          );
          setSelectedRestaurant(currentUser.restaurant_id);
        } else if (currentUser?.role === "ADMIN") {
          // Admin : tous les restaurants
          filteredRestaurants = activeRestaurants;
          setSelectedRestaurant(null);
        }

        setRestaurants(filteredRestaurants);
      } catch (error) {
        console.error("Erreur lors de la récupération des restaurants:", error);
        toast.error("Erreur lors du chargement des restaurants");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchRestaurants();
    }
  }, [currentUser]);

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
      console.error("Erreur lors de l'acceptation de la commande:", error);
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
      console.error("Erreur lors du refus de la commande:", error);
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
    <div className="flex-1 overflow-auto">
      <div className="px-2 lg:pt-2 pb-2 sm:px-4 sm:pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
        <OrderHeader
          currentView={view}
          onBack={() => handleViewChange("list")}
          onCreateMenu={() => handleViewChange("create")}
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
            {!loading && restaurants.length > 0 && (
              <RestaurantTabs
                restaurants={restaurants
                  .filter((r) => r.id)
                  .map((r) => ({ ...r, id: r.id! }))}
                selectedRestaurant={selectedRestaurant}
                onSelectRestaurant={setSelectedRestaurant}
                showAllTab={currentUser?.role === "ADMIN"} // Seulement pour ADMIN
              />
            )}

            <OrdersTable
              onViewDetails={handleViewOrderDetails}
              searchQuery={searchQuery}
              selectedRestaurant={selectedRestaurant} // ✅ Filtre par restaurant
              currentUser={
                currentUser
                  ? {
                      ...currentUser,
                      id: currentUser.id || "",
                      role: currentUser.role || "",
                      restaurant_id: currentUser.restaurant_id,
                    }
                  : undefined
              } // Typage sécurisé
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
            onBack={() => handleViewChange("list")}
            onAccept={handleAcceptOrder}
            onReject={handleRejectOrder}
            onStatusChange={handleStatusChange}
          />
        )}

        {view === "create" && canCreatePlat() && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 lg:w-2/3">
              <AddMenu />
            </div>
            <div className="w-full lg:w-1/3 invisible">
              {/* Espace vide comme dans Menus */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
