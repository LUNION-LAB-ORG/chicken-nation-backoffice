"use client";

import React from "react";
import { useOrderDetailQuery } from "../../queries/order-detail.query";
import { OrderTable } from "../../types/ordersTable.types";
import { mapApiOrderToUiOrder } from "../../utils/orderMapper";
import CustomerInfoSection from "./CustomerInfoSection";
import DeliveryProgressSection from "./DeliveryProgressSection";
import OrderInfoSection from "./OrderInfoSection";
import OrderItemsSection from "./OrderItemsSection";
import PriceSummarySection from "./PriceSummarySection";
import WorkflowActions from "./WorkflowActions";

export interface OrderDetailsProps {
  selectedItem: OrderTable;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ selectedItem }) => {
  const { data: orderDetail } = useOrderDetailQuery(selectedItem.id);
  const order = orderDetail ? mapApiOrderToUiOrder(orderDetail) : selectedItem;
  // const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  return (
    <>
      <div className="bg-white rounded-xl min-h-screen shadow-sm">
        <div className="">
          <div className="flex flex-col md:flex-row gap-4 md:gap-12">
            {/* Partie gauche */}
            <div className="md:w-3/5 p-4 sm:p-6 h-auto">
              <OrderInfoSection order={order} />

              <OrderItemsSection order={order} />
            </div>

            {/* Partie droite */}
            <div className="md:w-3/6 p-4 sm:p-6 pb-20 md:pb-6 bg-[#FBFBFB] h-auto overflow-y-auto md:overflow-visible">
              <CustomerInfoSection order={order} />

              <DeliveryProgressSection order={order} />

              <PriceSummarySection order={order} />

              <WorkflowActions order={order} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetails;
