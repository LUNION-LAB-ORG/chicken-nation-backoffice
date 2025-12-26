import React from "react";
import { Pagination } from "@/components/ui/pagination";
import { useDashboardStore } from "@/store/dashboardStore";

interface OrdersPaginationInfoProps {
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
}

export const OrdersPaginationInfo: React.FC<OrdersPaginationInfoProps> = ({
  totalItems,
  totalPages,
  isLoading,
}) => {
  const {
    orders: { pagination },
    setPagination,
  } = useDashboardStore();

  return (
    <div className="flex flex-col items-center py-4 px-2 space-y-2">
      {/* Statistiques avec indicateur de chargement */}
      <div className="text-sm text-gray-600 flex items-center gap-2">
        {!isLoading && totalItems > 0 && (
          <span className="text-xs">
            {totalItems} commande{totalItems > 1 ? "s" : ""} au total
          </span>
        )}

        {isLoading && (
          <div className="flex items-center gap-1 text-[#F17922]">
            <div className="w-3 h-3 border border-[#F17922] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Chargement...</span>
          </div>
        )}
      </div>

      {/* Pagination - Toujours affichée, même avec 1 seule page */}
      <Pagination
        currentPage={pagination.page}
        totalPages={Math.max(1, totalPages)}
        onPageChange={(page) => setPagination("orders", page, pagination.limit)}
        isLoading={isLoading}
      />
    </div>
  );
};
