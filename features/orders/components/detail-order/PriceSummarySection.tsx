import React from "react";
import { OrderTable } from "../../types/ordersTable.types";

interface PriceSummarySectionProps {
  order: OrderTable;
}

const PriceSummarySection: React.FC<PriceSummarySectionProps> = ({ order }) => {
  return (
    <div className="space-y-2 md:space-y-3">
      <div className="flex justify-between items-center text-[#71717A] mb-3">
        <span className="text-sm">Prix net</span>
        <span className="font-bold">{order.netAmount.toLocaleString()}F</span>
      </div>

      <div className="flex justify-between items-center text-sm text-green-400 mb-3">
        <span>Taxe</span>
        <span className="font-bold">
          {order.tax ? `${order.tax.toLocaleString()}F` : "--"}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm text-green-400 mb-3">
        <span>Frais de livraison</span>
        <span className="font-bold">
          {order.deliveryFee ? `${order.deliveryFee.toLocaleString()}F` : "--"}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm text-red-400 mb-6">
        <span>Réduction</span>
        <span className="font-bold">
          {order.discount ? `${order.discount.toLocaleString()}F` : "--"}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[18px] font-medium text-[#F17922]">
          Prix Total
        </span>
        <div className="bg-[#F17922] text-white px-6 py-2 rounded-xl font-bold">
          {order.amount.toLocaleString()}F
        </div>
      </div>
    </div>
  );
};

export default PriceSummarySection;
