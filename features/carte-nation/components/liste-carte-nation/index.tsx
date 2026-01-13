import {
  ErrorState,
  LoadingState,
  PaginationInfo,
} from "@/components/TableStates";
import { useMemo } from "react";
import { PaginatedResponse } from "../../../../types";
import { useCartesNationSelection } from "../../hooks/useCartesNationSelection";
import { NationCard } from "../../types/carte-nation.types";
import { CarteNationRow } from "./CarteNationRow";
import { TableHeader } from "./TableHeader";

export interface ClientsTableProps {
  cartesNationResponse?: PaginatedResponse<NationCard>;
  isLoading: boolean;
  error?: Error;
}

export function CarteNationTable({
  cartesNationResponse,
  isLoading,
  error,
}: ClientsTableProps) {
  // Conversion: Extraire les données
  const cartesNation = useMemo(() => {
    return cartesNationResponse?.data && cartesNationResponse?.data.length > 0
      ? cartesNationResponse?.data
      : [];
  }, [cartesNationResponse]);

  // Gestion de la sélection
  const {
    selectedClients,
    isAllSelected,
    handleSelectAll,
    handleSelectClient,
  } = useCartesNationSelection({
    cartesNation,
  });

  // Afficher un indicateur de chargement
  if (isLoading && cartesNation.length === 0) {
    return <LoadingState />;
  }

  // Afficher un message d'erreur
  if (error && cartesNation.length === 0) {
    return (
      <ErrorState
        title="Erreur lors du chargement des cartes nation"
        error={error}
      />
    );
  }

  return (
    <div className="min-w-full bg-white min-h-screen border border-slate-300 p-2 rounded-xl overflow-auto">
      <div className="min-w-full mt-4">
        {/* Version mobile */}
        <div className="md:hidden px-2 space-y-3 overflow-x-auto">
          {cartesNation.map((carteNation) => (
            <CarteNationRow
              key={carteNation.id}
              carteNation={carteNation}
              isSelected={selectedClients.includes(carteNation.id)}
              onSelect={handleSelectClient}
              isMobile={true}
            />
          ))}
        </div>

        {/* Version desktop */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="min-w-full">
              <TableHeader
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
              />
              <tbody>
                {cartesNation.map((carteNation) => (
                  <CarteNationRow
                    key={carteNation.id}
                    carteNation={carteNation}
                    isSelected={selectedClients.includes(carteNation.id)}
                    onSelect={handleSelectClient}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message si aucun client */}
        {cartesNation.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Aucune carte de la nation trouvée
          </div>
        )}
      </div>

      {/* Pagination et statistiques */}
      <PaginationInfo
        tabKey="card_nation"
        label="carte de la nation"
        totalItems={cartesNationResponse?.meta?.total}
        totalPages={cartesNationResponse?.meta?.totalPages}
        isLoading={isLoading}
      />
    </div>
  );
}
