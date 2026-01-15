"use client";
import { useAuthStore } from "../../../../features/users/hook/authStore";
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
import {
  OrderStatus,
  OrderType,
} from "../../../../features/orders/types/order.types";
import { UserType } from "../../../../features/users/types/user.types";

export default function Orders() {
  const { user: currentUser } = useAuthStore();

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
    reference: filters?.search as string,
    startDate: filters?.startDate
      ? typeof filters?.startDate == "string"
        ? filters?.startDate
        : (filters?.startDate as Date).toISOString()
      : undefined,
    endDate: filters?.endDate
      ? typeof filters?.endDate == "string"
        ? filters?.endDate
        : (filters?.endDate as Date).toISOString()
      : undefined,
    type: filters?.type ? (filters?.type as OrderType) : undefined,
    status: filters?.status ? (filters?.status as OrderStatus) : undefined,
    auto: filters?.source
      ? filters?.source == "auto"
        ? true
        : false
      : undefined,
  });

  return (
    <div className="flex-1 p-4">
      <OrderHeader />
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

      {view === "create" && <AddOrderForm />}

      {modals?.to_cancel && selectedItem && (
        <CancelOrderModal isOpen={true} order={selectedItem} />
      )}
      {modals?.add_paiement && selectedItem && (
        <AddPaiementModal isOpen={true} order={selectedItem} />
      )}
    </div>
  );
}
