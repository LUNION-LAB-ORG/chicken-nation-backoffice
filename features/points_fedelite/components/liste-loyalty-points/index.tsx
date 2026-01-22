import {
  ErrorState,
  LoadingState,
  PaginationInfo,
} from "@/components/TableStates";
import { useMemo } from "react";

import { LoyaltyPointRow } from "./LoyaltyPointRow";
import { LoyaltyTableHeader } from "./LoyaltyTableHeader";
import { LoyaltyPoint } from "../../types/loyalty.types";
import { PaginatedResponse } from "../../../../types";

export interface LoyaltyPointsTableProps {
  points?: PaginatedResponse<LoyaltyPoint>;
  isLoading: boolean;
  error?: Error;
}

export function LoyaltyPointsList({
  points,
  isLoading,
  error,
}: LoyaltyPointsTableProps) {
  // Conversion: Extraire les données
  const loyaltyPoints = useMemo(() => {
    return points?.data && points?.data.length > 0 ? points?.data : [];
  }, [points]);

  // Afficher un indicateur de chargement
  if (isLoading && loyaltyPoints.length === 0) {
    return <LoadingState />;
  }

  // Afficher un message d'erreur
  if (error && loyaltyPoints.length === 0) {
    return (
      <ErrorState
        title="Erreur lors du chargement des points fidélité"
        error={error}
      />
    );
  }

  return (
    <div className="min-w-full bg-white min-h-screen border border-slate-300 p-2 rounded-xl overflow-auto">
      <div className="min-w-full mt-4">
        {/* Version mobile */}
        <div className="md:hidden px-2 space-y-3 overflow-x-auto">
          {loyaltyPoints.map((point) => (
            <LoyaltyPointRow key={point.id} point={point} isMobile={true} />
          ))}
        </div>

        {/* Version desktop */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="min-w-full">
              <LoyaltyTableHeader />
              <tbody>
                {loyaltyPoints.map((point) => (
                  <LoyaltyPointRow key={point.id} point={point} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message si aucun point */}
        {loyaltyPoints.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Aucun point de fidélité trouvé
          </div>
        )}
      </div>

      {/* Pagination et statistiques */}
      <PaginationInfo
        tabKey="loyalty"
        label="point de fidélité"
        totalItems={points?.meta?.total}
        totalPages={points?.meta?.totalPages}
        isLoading={isLoading}
      />
    </div>
  );
}
