import React from "react";
import { Pagination } from "@/components/ui/pagination";
import { TabKey, useDashboardStore } from "@/store/dashboardStore";

export const LoadingState: React.FC = () => {
  return (
    <div className="min-w-full bg-white h-screen border-1 border-slate-300 p-3 rounded-xl overflow-hidden flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  error: Error | null;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = "Erreur lors du chargement des commandes",
}) => {
  return (
    <div className="min-w-full bg-white h-screen border-1 border-slate-300 p-3 rounded-xl overflow-hidden flex justify-center items-center">
      <div className="text-red-500 text-center">
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm">{error?.message || "Erreur inconnue"}</p>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "Aucune commande disponible",
}) => {
  return (
    <div className="min-w-full bg-white h-screen border-1 border-slate-300 p-3 rounded-xl overflow-hidden flex justify-center items-center">
      <div className="text-gray-500 text-center">
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};

interface PaginationInfoProps {
  tabKey: TabKey;
  label: string;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
}

export const PaginationInfo: React.FC<PaginationInfoProps> = ({
  tabKey,
  label,
  totalItems,
  totalPages,
  isLoading,
}) => {
  const {
    [tabKey]: { pagination },
    setPagination,
  } = useDashboardStore();

  return (
    <div className="flex flex-col items-center py-4 px-2 space-y-2">
      {/* Statistiques avec indicateur de chargement */}
      <div className="text-sm text-gray-600 flex items-center gap-2">
        {!isLoading && totalItems > 0 && (
          <span className="text-xs">
            {totalItems} {label}
            {totalItems > 1 ? "s" : ""} au total
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
        onPageChange={(page) => setPagination(tabKey, page, pagination.limit)}
        isLoading={isLoading}
      />
    </div>
  );
};
