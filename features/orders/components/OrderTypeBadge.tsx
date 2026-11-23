import Image from "next/image";
import { OrderTable } from "../types/ordersTable.types";

export const OrderTypeBadge = ({ type }: { type: OrderTable["orderType"] }) => {
  const styles = {
    "À livrer": "bg-hex-fbdba7 text-hex-71717a",
    "À table": "bg-hex-cce3fd text-hex-71717a",
    "À récupérer": "bg-hex-c9a9e9 text-blanc",
  };

  const getIcon = () => {
    if (type === "À livrer") return "/icons/deliver.png";
    if (type === "À table") return "/icons/store.png";
    return "/icons/resto.png";
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles[type]}`}
    >
      {type}{" "}
      <Image
        src={getIcon()}
        alt={type}
        width={15}
        height={15}
        className="ml-1"
      />
    </span>
  );
};
