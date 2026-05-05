import React from "react";
import { Truck } from "lucide-react";

import { DeliveryService } from "../../orders/types/order.types";

interface Props {
  service: DeliveryService;
  size?: "sm" | "md";
}

const LABELS: Record<DeliveryService, string> = {
  CHICKEN_NATION: "Chicken Nation",
  TURBO: "Turbo",
  FREE: "Standard",
};

const CLASSES: Record<DeliveryService, string> = {
  CHICKEN_NATION: "bg-orange-100 text-orange-700 border-orange-200",
  TURBO: "bg-blue-100 text-blue-700 border-blue-200",
  FREE: "bg-gray-100 text-gray-700 border-gray-200",
};

/** Pastille identifiant le type de service de livraison (CN / Turbo / Standard). */
export const ServiceBadge: React.FC<Props> = ({ service, size = "md" }) => {
  const sizeCls = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${sizeCls} ${CLASSES[service]}`}
    >
      <Truck className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {LABELS[service]}
    </span>
  );
};
