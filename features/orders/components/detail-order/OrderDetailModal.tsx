import React from "react";
import { X } from "lucide-react";
import { OrderTable } from "../../types/ordersTable.types";
import { useOrderDetailQuery } from "../../queries/order-detail.query";
import { mapApiOrderToUiOrder } from "../../utils/orderMapper";
import OrderInfoSection from "./OrderInfoSection";
import OrderItemsSection from "./OrderItemsSection";
import CustomerInfoSection from "./CustomerInfoSection";
import DeliveryProgressSection from "./DeliveryProgressSection";
import PriceSummarySection from "./PriceSummarySection";

interface OrderDetailModalProps {
  order: OrderTable;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order: initialOrder, onClose }) => {
  const { data: orderDetail } = useOrderDetailQuery(initialOrder.id);
  const order = orderDetail ? mapApiOrderToUiOrder(orderDetail) : initialOrder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Commande #{order.reference}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {order.restaurantName} &middot; {order.orderType} &middot; {order.status}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row">
            {/* Left */}
            <div className="md:w-3/5 p-6">
              <OrderInfoSection order={order} />
              <OrderItemsSection order={order} />
            </div>

            {/* Right */}
            <div className="md:w-2/5 p-6 bg-[#FBFBFB]">
              <CustomerInfoSection order={order} />
              <DeliveryProgressSection order={order} />
              <PriceSummarySection order={order} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
