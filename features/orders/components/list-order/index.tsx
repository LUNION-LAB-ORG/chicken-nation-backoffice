"use client";

import { useMemo } from "react";
import {
  ErrorState,
  LoadingState,
  PaginationInfo,
} from "../../../../src/components/TableStates";
import { useOrderSelection } from "../../hooks/useOrderSelection";
import { Order as IOrder } from "../../types/order.types";
import { mapApiOrdersToUiOrders } from "../../utils/orderMapper";

import { PaginatedResponse } from "../../../../types";
import { User } from "../../../users/types/user.types";
import { OrderRow } from "./OrderRow";
import { TableHeader } from "./TableHeader";

export interface OrdersTableProps {
  currentUser?: User;
  orders?: PaginatedResponse<IOrder>;
  isLoading: boolean;
  error: Error;
}
export function OrdersTable({
  currentUser = null,
  orders,
  isLoading,
  error,
}: OrdersTableProps) {
  // Conversion: Mapper les données API vers UI
  const ordersToDisplay = useMemo(() => {
    return orders?.data && orders?.data.length > 0
      ? mapApiOrdersToUiOrders(orders?.data)
      : [];
  }, [orders]);

  // Gestion de la sélection
  const { selectedOrders, isAllSelected, handleSelectAll, handleSelectOrder } =
    useOrderSelection({
      orders: ordersToDisplay,
    });

  // Afficher un indicateur de chargement
  if (isLoading && ordersToDisplay.length === 0) {
    return <LoadingState />;
  }

  // Afficher un message d'erreur
  if (error && ordersToDisplay.length === 0) {
    return <ErrorState error={error} />;
  }

  return (
    <>
      <div className="min-w-full bg-white min-h-screen border border-slate-300 p-2 rounded-xl overflow-auto">
        <div className="min-w-full mt-4">
          <div className="md:hidden px-2 space-y-3 overflow-x-auto">
            {ordersToDisplay.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isSelected={selectedOrders.includes(order.id)}
                onSelect={handleSelectOrder}
                isMobile={true}
              />
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[1200px]">
              <table className="min-w-full">
                <TableHeader
                  onSelectAll={handleSelectAll}
                  isAllSelected={isAllSelected}
                  showRestaurantColumn={!currentUser?.restaurant_id}
                />
                <tbody>
                  {ordersToDisplay.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isSelected={selectedOrders.includes(order.id)}
                      onSelect={handleSelectOrder}
                      showRestaurantColumn={!currentUser?.restaurant_id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination et statistiques */}
        <PaginationInfo
          tabKey="orders"
          label="commande"
          totalItems={orders?.meta?.total}
          totalPages={orders?.meta?.totalPages}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
