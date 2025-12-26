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

      {/* Modal de confirmation */}
      {/* <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelConfirm}
        title="Terminer la commande"
      >
        <div className="text-center text-[#484848] text-[16px] mb-6">
          Êtes-vous sûr de vouloir terminer cette commande ?<br />
          Cette action marquera la commande comme terminée et ne pourra pas être
          annulée.
        </div>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px]"
            onClick={handleCancelConfirm}
          >
            Annuler
          </button>
          <button
            type="button"
            className="bg-[#F17922] text-white cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px]"
            onClick={handleConfirmFinish}
          >
            Confirmer
          </button>
        </div>
      </Modal> */}
    </div>
  );
};

export default OrderDetails;
