import React from "react";
import { format } from "date-fns";
import SafeImage from "@/components/ui/SafeImage";
import PaymentBadge from "../PaymentBadge";
import { OrderTable } from "../../types/ordersTable.types";
import { useOrderWorkFlow } from "../../hooks/useOrderWorkFlow";

interface OrderInfoSectionProps {
  order: OrderTable;
}

const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({ order }) => {
  const {
    getWorkFlow: { badgeText },
  } = useOrderWorkFlow({
    order,
  });
  return (
    <div className="mb-4 md:mb-6">
      <div className="flex justify-between items-center">
        <h2 className="xl:text-lg text-sm font-medium text-[#F17922]">
          Information sur la commande{" "}
          <span className="text-xs font-bold ">#{order.reference}</span>
        </h2>
        <div className="flex items-center space-x-2">
          {badgeText && (
            <span className="px-3 py-1.5 border-1 border-[#FBD2B5] font-bold text-[#FF3B30] text-[10px] lg:text-xs rounded-lg">
              {badgeText}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
        <div className="flex gap-40 items-center">
          <p className="lg:text-sm text-xs font-medium text-[#71717A]">
            Restaurant
          </p>
          <p className="font-bold text-[#F17922] lg:text-sm text-xs">
            {order.restaurantName}
          </p>
        </div>

        <div className="flex gap-26 items-center">
          <p className="lg:text-sm text-xs font-medium text-[#71717A]">
            Type de commande
          </p>
          <div className="inline-flex items-center rounded-[10px] px-3 py-[4px] text-xs font-medium bg-[#FBDBA7] text-[#71717A]">
            {order.orderType}
            <SafeImage
              className="ml-2"
              src="/icons/deliver.png"
              alt="truck"
              width={15}
              height={15}
            />
          </div>
        </div>

        <div className="flex gap-22 items-center">
          <p className="lg:text-sm text-xs font-medium text-[#71717A]">
            Date de la commande
          </p>
          <p className="font-bold text-xs lg:text-sm text-[#71717A]">
            {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>

        <div className="flex gap-41 items-center">
          <p className="lg:text-sm text-xs font-medium text-[#71717A]">
            Référence
          </p>
          <p className="font-bold text-xs lg:text-sm text-[#71717A]">
            {order.reference}
          </p>
        </div>
        {order.paymentMethod && (
          <div className="flex gap-32 items-center">
            <p className="lg:text-sm text-xs font-medium text-[#71717A]">
              Mode paiement
            </p>
            <div className="flex items-center">
              <p className="font-bold text-xs lg:text-sm text-[#71717A]">
                {order.paymentMethod}
              </p>
            </div>
          </div>
        )}

        {order.note && (
          <div className="flex gap-32 items-center">
            <p className="lg:text-sm text-xs font-medium text-[#71717A]">
              Note
            </p>
            <div className="flex items-center">
              <p className="font-bold text-xs lg:text-sm text-[#71717A]">
                {order.note}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-32 items-center">
          <p className="lg:text-sm text-xs font-medium text-[#71717A]">
            Statut paiement
          </p>
          <div className="flex items-center">
            <PaymentBadge
              status={order.paymentStatus}
              mode={order.paymentSource}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInfoSection;
