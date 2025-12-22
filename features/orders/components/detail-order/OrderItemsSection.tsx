// components/OrderItemsSection.tsx

import React from "react";
import SafeImage from "@/components/ui/SafeImage";
import { Order } from "../../types/ordersTable.types";

interface OrderItemsSectionProps {
  orderItems: Order["items"];
  totalPrice: number;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  orderItems,
  totalPrice,
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4 text-[#F17922]">Commande</h3>
      <div className="flex flex-row items-center justify-between mb-6">
        <span className="text-xs font-medium text-[#71717A]">
          Coût de la commande
        </span>
        <span className="text-sm font-bold text-[#F17922]">
          {totalPrice.toLocaleString()}F
        </span>
      </div>

      {orderItems && orderItems.length > 0 ? (
        orderItems.map((item) => {
          return (
            <div key={item.id || Math.random()}>
              <div className="flex items-center">
                <div className="w-16 h-12 my-2 rounded-lg mr-3 relative overflow-hidden">
                  <SafeImage
                    src={item.image}
                    alt={item.name || "Article"}
                    width={80}
                    height={64}
                    className="object-cover"
                  />
                  {item.price === 0 && (
                    <div className="absolute bottom-0 right-0 bg-[#F17922] text-white text-[8px] px-1 py-0.5 rounded-tl-md">
                      Offert
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-600">
                          {item.name}
                          {item.price === 0 && (
                            <span className="ml-1 text-xs text-[#F17922] font-normal">
                              (Offert)
                            </span>
                          )}
                        </p>
                        {item.epice && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            🌶️ Épicé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Quantité: {item.quantity}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold ${
                        item.price === 0 ? "text-[#F17922]" : "text-[#71717A]"
                      }`}
                    >
                      {item.price === 0
                        ? "Offert"
                        : `${item.price.toLocaleString()} F`}
                    </p>
                  </div>
                  {item.supplemens && (
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-500">
                          Suppléments :
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.supplemens}
                        </span>
                      </div>
                      <p className={`text-sm font-medium text-[#71717A]`}>
                        {`${item.supplementsPrice.toLocaleString()} F`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>Aucun article dans cette commande</p>
        </div>
      )}
    </div>
  );
};

export default OrderItemsSection;