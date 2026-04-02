import React from "react";
import { OrderTable } from "../../types/ordersTable.types";

interface PriceSummarySectionProps {
  order: OrderTable;
}

function getDiscountSources(order: OrderTable): string[] {
  const sources: string[] = [];
  if (order.points && order.points > 0) {
    sources.push(`Points de fidélité (${order.points} pts)`);
  }
  if (order.codePromo) {
    sources.push(`Code promo (${order.codePromo})`);
  }
  if (order.promotionId) {
    sources.push(order.promotionTitle ? `Promo : ${order.promotionTitle}` : "Promotion");
  }
  if (sources.length === 0 && order.discount > 0) {
    sources.push("Autre");
  }
  return sources;
}

const PriceSummarySection: React.FC<PriceSummarySectionProps> = ({ order }) => {
  const discountSources = getDiscountSources(order);

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

      <div className="mb-6">
        <div className="flex justify-between items-center text-sm text-red-400">
          <span>Réduction</span>
          <span className="font-bold">
            {order.discount ? `-${order.discount.toLocaleString()}F` : "--"}
          </span>
        </div>
        {discountSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {discountSources.map((source, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-500 border border-red-100"
              >
                {source}
              </span>
            ))}
          </div>
        )}
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
