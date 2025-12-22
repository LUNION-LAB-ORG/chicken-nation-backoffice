import React from "react";

interface PriceSummarySectionProps {
  subtotal: number;
  tax: number;
  deliveryPrice?: number;
  discount: number;
  totalPrice: number;
}

const PriceSummarySection: React.FC<PriceSummarySectionProps> = ({
  subtotal,
  tax,
  deliveryPrice,
  discount,
  totalPrice,
}) => {
  return (
    <div className="space-y-2 md:space-y-3">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[#71717A]">Prix net</span>
        <span className="text-sm font-bold text-[#71717A]">
          {subtotal.toLocaleString()}F
        </span>
      </div>

      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[#71717A]">Taxe</span>
        <span className="text-sm font-bold text-[#71717A]">
          {tax ? `${tax.toLocaleString()}F` : "--"}
        </span>
      </div>

      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[#71717A]">Frais de livraison</span>
        <span className="text-sm font-bold text-[#71717A]">
          {deliveryPrice ? `${deliveryPrice.toLocaleString()}F` : "--"}
        </span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-[#71717A]">Réduction</span>
        <span className="text-sm font-bold text-[#71717A]">
          {discount ? `${discount.toLocaleString()}F` : "--"}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[18px] font-medium text-[#F17922]">
          Prix Total
        </span>
        <div className="bg-[#F17922] text-white px-6 py-2 rounded-xl font-bold">
          {totalPrice.toLocaleString()}F
        </div>
      </div>
    </div>
  );
};

export default PriceSummarySection;