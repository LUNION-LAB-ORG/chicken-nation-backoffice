import { useMemo } from "react";
import { useClientsSelection } from "../../hooks/useClientsSelection";
import { Customer } from "../../types/customer.types";
import {
  ErrorState,
  LoadingState,
  PaginationInfo,
} from "@/components/TableStates";
import { PaginatedResponse } from "../../../../types";
import { TableHeader } from "./TableHeader";
import { ClientRow } from "./ClientRow";

export interface ClientsTableProps {
  clientResponse?: PaginatedResponse<Customer>;
  isLoading: boolean;
  error?: Error;
}

export function ClientsTable({
  clientResponse,
  isLoading,
  error,
}: ClientsTableProps) {
  // Conversion: Extraire les données
  const clients = useMemo(() => {
    return clientResponse?.data && clientResponse?.data.length > 0
      ? clientResponse?.data
      : [];
  }, [clientResponse]);

  // Gestion de la sélection
  const {
    selectedClients,
    isAllSelected,
    handleSelectAll,
    handleSelectClient,
  } = useClientsSelection({
    clients,
  });

  // Afficher un indicateur de chargement
  if (isLoading && clients.length === 0) {
    return <LoadingState />;
  }

  // Afficher un message d'erreur
  if (error && clients.length === 0) {
    return (
      <ErrorState title="Erreur lors du chargement des clients" error={error} />
    );
  }

  return (
    <div className="min-w-full bg-white min-h-screen border border-slate-300 p-2 rounded-xl overflow-auto">
      <div className="min-w-full mt-4">
        {/* Version mobile */}
        <div className="md:hidden px-2 space-y-3 overflow-x-auto">
          {clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              isSelected={selectedClients.includes(client.id)}
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
                {clients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    isSelected={selectedClients.includes(client.id)}
                    onSelect={handleSelectClient}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message si aucun client */}
        {clients.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Aucun client trouvé
          </div>
        )}
      </div>

      {/* Pagination et statistiques */}
      <PaginationInfo
        tabKey="clients"
        label="client"
        totalItems={clientResponse?.meta?.total}
        totalPages={clientResponse?.meta?.totalPages}
        isLoading={isLoading}
      />
    </div>
  );
}
