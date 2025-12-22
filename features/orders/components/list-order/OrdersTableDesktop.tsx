import React from "react";
import { Order } from "../../types/ordersTable.types";
import { PaymentStatus } from "@/components/gestion/Orders/PaymentBadge";
import { TableHeader } from "@/components/gestion/Orders/TableHeader";
import { OrderRow } from "@/components/gestion/Orders/OrderRow";

interface OrdersTableDesktopProps {
  orders: Order[];
  selectedOrders: string[];
  isAllSelected: boolean;
  hasSelectionPermission: boolean;
  hasAnyActionPermission: boolean;
  showRestaurantColumn: boolean;
  canAcceptCommande: boolean;
  canRejectCommande: boolean;
  canDeleteCommande: boolean;
  onSelectAll?: (checked: boolean) => void;
  onSelectOrder?: (orderId: string, checked: boolean) => void;
  onAcceptOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
  onHideOrder?: (orderId: string) => void;
  onRemoveOrder?: (orderId: string) => void;
  getPaymentStatus: (order: Order) => PaymentStatus;
}

export const OrdersTableDesktop: React.FC<OrdersTableDesktopProps> = ({
  orders,
  selectedOrders,
  isAllSelected,
  hasSelectionPermission,
  hasAnyActionPermission,
  showRestaurantColumn,
  canAcceptCommande,
  canRejectCommande,
  canDeleteCommande,
  onSelectAll,
  onSelectOrder,
  onAcceptOrder,
  onRejectOrder,
  onViewDetails,
  onHideOrder,
  onRemoveOrder,
  getPaymentStatus,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <div className="min-w-[1200px]">
        <table className="min-w-full">
          <TableHeader
            onSelectAll={hasSelectionPermission ? onSelectAll : undefined}
            isAllSelected={isAllSelected}
            showRestaurantColumn={showRestaurantColumn}
            showActionsColumn={hasAnyActionPermission}
          />
          <tbody>
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isSelected={selectedOrders.includes(order.id)}
                onSelect={hasSelectionPermission ? onSelectOrder : undefined}
                onAccept={canAcceptCommande ? onAcceptOrder : undefined}
                onReject={canRejectCommande ? onRejectOrder : undefined}
                onViewDetails={onViewDetails}
                onHideFromList={canDeleteCommande ? onHideOrder : undefined}
                onRemoveFromList={canDeleteCommande ? onRemoveOrder : undefined}
                showRestaurantColumn={showRestaurantColumn}
                showActionsColumn={hasAnyActionPermission}
                paymentStatus={getPaymentStatus(order)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};