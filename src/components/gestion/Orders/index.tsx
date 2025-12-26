"use client";
import { usePendingOrdersSound } from "@/hooks/usePendingOrdersSound";
import { useRBAC } from "@/hooks/useRBAC";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import AddOrderForm from "../../../../features/orders/components/add-order-form";
import OrderDetails from "../../../../features/orders/components/detail-order";
import { OrdersTable } from "../../../../features/orders/components/list-order";
import { UserType } from "../../../../features/users/types/user.types";
import RestaurantTabs from "../../../../features/orders/components/filtrage/RestaurantTabs";
import { useOrderListQuery } from "../../../../features/orders/queries/order-list.query";
import { OrderType } from "../../../../features/orders/types/order.types";
import OrderHeader from "../../../../features/orders/components/OrderHeader";
import { OrderFilters } from "../../../../features/orders/components/filtrage/OrderFilters";

export default function Orders() {
  const { user: currentUser } = useAuthStore();

  const { canCreateCommande } = useRBAC();

  const {
    orders: { view, selectedItem, filters, pagination },
    selectedRestaurantId,
  } = useDashboardStore();

  // ✅ Hook pour le son continu des commandes en attente
  const { hasPendingOrders, pendingOrdersCount } = usePendingOrdersSound({
    activeFilter: "nouvelle", // Utiliser 'nouvelle' pour les commandes PENDING
    selectedRestaurant: selectedRestaurantId || undefined,
    disabledSound: true, // Toujours activé pour l'instant
  });

  const {
    data: orders,
    isLoading,
    error,
  } = useOrderListQuery({
    restaurantId: selectedRestaurantId,
    page: pagination.page,
    reference: filters?.search,
    startDate: filters?.date ? filters?.date.toISOString() : undefined,
    type:
      filters?.active_filter &&
      [OrderType.DELIVERY, OrderType.PICKUP, OrderType.TABLE].includes(
        filters?.active_filter
      )
        ? filters?.active_filter
        : undefined,
    status:
      filters?.active_filter &&
      ![OrderType.DELIVERY, OrderType.PICKUP, OrderType.TABLE].includes(
        filters?.active_filter
      )
        ? filters?.active_filter
        : undefined,
  });
  return (
    <div className="flex-1 p-4">
      <OrderHeader
        orders={orders?.data || []}
        currentView={view}
        hasPendingOrders={hasPendingOrders}
        pendingOrdersCount={pendingOrdersCount}
      />
      {view === "list" && (
        <div>
          {/* ✅ Tabs Restaurant - Au-dessus des filtres existants */}
          <RestaurantTabs
            showAllTab={currentUser?.type == UserType.BACKOFFICE} // Seulement pour ADMIN
          />
          {/* Composant de filtres */}
          <OrderFilters />
          <OrdersTable
            currentUser={currentUser}
            orders={orders}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}

      {view === "view" && selectedItem && (
        <OrderDetails selectedItem={selectedItem} />
      )}

      {view === "create" && canCreateCommande() && <AddOrderForm />}
    </div>
  );
}
