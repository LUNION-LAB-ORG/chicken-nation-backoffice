import React from "react";
import { Order } from "../../types/ordersTable.types";
import { PaymentStatus } from "@/components/gestion/Orders/PaymentBadge";
import { OrderRow } from "@/components/gestion/Orders/OrderRow";

interface OrdersTableMobileProps {
  orders: Order[];
  selectedOrders: string[];
  hasSelectionPermission: boolean;
  hasAnyActionPermission: boolean;
  canAcceptCommande: boolean;
  canRejectCommande: boolean;
  canDeleteCommande: boolean;
  onSelectOrder?: (orderId: string, checked: boolean) => void;
  onAcceptOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
  onHideOrder?: (orderId: string) => void;
  onRemoveOrder?: (orderId: string) => void;
  getPaymentStatus: (order: Order) => PaymentStatus;
}

export const OrdersTableMobile: React.FC<OrdersTableMobileProps> = ({
  orders,
  selectedOrders,
  hasSelectionPermission,
  hasAnyActionPermission,
  canAcceptCommande,
  canRejectCommande,
  canDeleteCommande,
  onSelectOrder,
  onAcceptOrder,
  onRejectOrder,
  onViewDetails,
  onHideOrder,
  onRemoveOrder,
  getPaymentStatus,
}) => {
  return (
    <div className="md:hidden px-2 space-y-3 overflow-x-auto">
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
          isMobile={true}
          showActionsColumn={hasAnyActionPermission}
          paymentStatus={getPaymentStatus(order)}
        />
      ))}
    </div>
  );
};