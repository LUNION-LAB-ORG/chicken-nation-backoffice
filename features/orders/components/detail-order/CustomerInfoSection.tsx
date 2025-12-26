import React from "react";
import { formatAddress } from "../../utils/orderUtils";
import { OrderTable } from "../../types/ordersTable.types";

interface CustomerInfoSectionProps {
  order: OrderTable;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ order }) => {
  return (
    <div className="mb-4 md:mb-8">
      <p className="text-[18px] font-medium text-[#F17922] mb-4">Client</p>

      <div className="flex flex-row items-center justify-between mb-4">
        <p className="text-sm text-[#71717A]">Client</p>
        <p className="text-sm text-[#71717A] font-bold">{order.clientName}</p>
      </div>

      <div className="flex flex-row justify-between items-start mb-4">
        <p className="text-sm text-[#71717A]">Adresse</p>
        <p className="text-sm text-[#71717A] font-bold text-right max-w-[250px]">
          {formatAddress(order.address)}
        </p>
      </div>

      {order.clientEmail && (
        <div className="flex flex-row items-center justify-between mb-2">
          <p className="text-sm text-[#71717A]">Email</p>
          <p className="text-sm text-[#71717A] font-bold">{order.clientEmail}</p>
        </div>
      )}

      {order.clientPhone && (
        <div className="flex flex-row items-center justify-between mb-2">
          <p className="text-sm text-[#71717A]">Téléphone</p>
          <p className="text-sm text-[#71717A] font-bold">{order.clientPhone}</p>
        </div>
      )}
    </div>
  );
};

export default CustomerInfoSection;
