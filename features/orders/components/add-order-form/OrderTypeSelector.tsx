"use client";

import React from "react";
import { motion } from "framer-motion";
import { OrderType } from "../../types/order.types";

interface OrderTypeSelectorProps {
  selectedType: OrderType;
  onChange: (type: OrderType) => void;
}

const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  selectedType,
  onChange,
}) => {
  const orderTypes = [
    { value: OrderType.DELIVERY, label: "Livraison", icon: "🚚" },
    { value: OrderType.PICKUP, label: "Retrait", icon: "🏪" },
    { value: OrderType.TABLE, label: "Sur place", icon: "🍽️" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#595959]">
        Type de commande *
      </label>
      <div className="grid grid-cols-3 gap-3">
        {orderTypes.map((type) => (
          <motion.button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`
              px-4 py-3 rounded-xl border-2 transition-all
              flex flex-col items-center justify-center gap-2
              ${
                selectedType === type.value
                  ? "border-[#F17922] bg-[#F17922]/10 text-[#F17922]"
                  : "border-[#D9D9D9] bg-white text-[#595959] hover:border-[#F17922]/50"
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl">{type.icon}</span>
            <span className="text-sm font-semibold">{type.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default OrderTypeSelector;