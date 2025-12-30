"use client";
import { useRBAC } from "@/hooks/useRBAC";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import OrderHeader from "../../../../features/orders/components/OrderHeader";
import AddOrderForm from "../../../../features/orders/components/add-order-form";
import OrderDetails from "../../../../features/orders/components/detail-order";
import { OrderFilters } from "../../../../features/orders/components/filtrage/OrderFilters";
import RestaurantTabs from "../../../../features/orders/components/filtrage/RestaurantTabs";
import { OrdersTable } from "../../../../features/orders/components/list-order";
import { AddPaiementModal } from "../../../../features/orders/components/modals/AddPaiementModal";
import { CancelOrderModal } from "../../../../features/orders/components/modals/CancelOrderModal";
import { useOrderListQuery } from "../../../../features/orders/queries/order-list.query";
import { OrderType } from "../../../../features/orders/types/order.types";
import { UserType } from "../../../../features/users/types/user.types";

export default function Orders() {
  const { user: currentUser } = useAuthStore();

  const { canCreateCommande } = useRBAC();

  const {
    orders: { view, selectedItem, filters, pagination, modals },
    selectedRestaurantId,
  } = useDashboardStore();

  const {
    data: orders,
    isLoading,
    error,
  } = useOrderListQuery({
    restaurantId: selectedRestaurantId,
    page: pagination.page,
    reference: filters?.search,
    startDate: filters?.date
      ? typeof filters?.date == "string"
        ? filters?.date
        : filters?.date.toISOString()
      : undefined,
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
      <OrderHeader orders={orders?.data || []} currentView={view} />
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

      {modals?.to_cancel && selectedItem && (
        <CancelOrderModal isOpen={true} order={selectedItem} />
      )}
      {modals?.add_paiement && selectedItem && (
        <AddPaiementModal isOpen={true} order={selectedItem} />
      )}
    </div>
  );
}
