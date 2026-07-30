"use client";

import React from "react";
import { Bike, ShoppingBag, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { OrderType } from "../../types/order.types";

interface OrderTypeSelectorProps {
  selectedType: OrderType;
  onChange: (type: OrderType) => void;
}

const ORDER_TYPES: {
  value: OrderType;
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    value: OrderType.DELIVERY,
    label: "Livraison",
    desc: "Livrée chez le client",
    icon: Bike,
  },
  {
    value: OrderType.PICKUP,
    label: "Retrait",
    desc: "Le client vient chercher",
    icon: ShoppingBag,
  },
  {
    value: OrderType.TABLE,
    label: "Sur place",
    desc: "Service à table",
    icon: UtensilsCrossed,
  },
];

const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  selectedType,
  onChange,
}) => {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
        Type de commande *
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {ORDER_TYPES.map((type) => {
          const selected = selectedType === type.value;
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              aria-pressed={selected}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                selected
                  ? "border-[#F17922] bg-orange-50"
                  : "border-gray-200 bg-white hover:border-[#F17922]/40 hover:bg-gray-50"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                  selected
                    ? "bg-[#F17922] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm font-bold ${
                    selected ? "text-[#F17922]" : "text-gray-700"
                  }`}
                >
                  {type.label}
                </span>
                <span className="block truncate text-[11px] text-gray-400">
                  {type.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTypeSelector;
