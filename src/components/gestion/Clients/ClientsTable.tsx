import React, { useState } from 'react';
import { ClientRow } from './ClientRow'
import { Pagination } from '@/components/ui/pagination'
import { TableHeader } from './TableHeader'
import { Customer } from '@/services/customerService'
import { useCustomersQuery } from '@/hooks/useCustomersQuery'

export type Client = Customer;

interface ClientsTableProps {
  selectedClientId?: string | null;
  onClientClick: (clientId: string) => void;
  onClientDoubleClick: (clientId: string) => void;
  onViewProfile?: (clientId: string) => void;  
  connectedOnly?: boolean;
  isLoading?: boolean;
  searchQuery?: string;
  restaurantId?: string;  
}

export function ClientsTable({
  selectedClientId,
  onClientClick,
  onClientDoubleClick,
  onViewProfile,
  connectedOnly = false,
  isLoading = false,
  searchQuery = '',
  restaurantId  
}: ClientsTableProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // ✅ Utiliser TanStack Query pour les clients - exactement comme OrdersTable
  const {
    customers,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    isLoading: queryLoading
  } = useCustomersQuery({
    searchQuery,
    showConnectedOnly: connectedOnly,
    restaurantId
  });

  console.log("ClientsTable - customers:", customers);

  // ✅ Utiliser le loading du hook ou celui passé en props
  const actualLoading = queryLoading || isLoading;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(customers.map(client => client.id))
    } else {
      setSelectedClients([])
    }
  }

  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId])
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId))
    }
  }

  const handleClientClick = (clientId: string) => {
    if (clientId) {
      onClientClick(clientId);
    } else {
      console.error("Client ID is undefined or null");
    }
  };

  const handleClientDoubleClick = (clientId: string) => {
    if (clientId) {
      onClientDoubleClick(clientId);
    } else {
      console.error("Client ID is undefined or null");
    }
  };

  // ✅ Fonction de changement de page simple - exactement comme OrdersTable
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-w-full bg-white">
      <div className="overflow-hidden">
        {actualLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y border-1 border-slate-200 rounded-xl divide-gray-200">
            <TableHeader
              onSelectAll={handleSelectAll}
              isAllSelected={selectedClients.length === customers.length && customers.length > 0}
            />
            <tbody className="divide-y divide-gray-200">
              {customers.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  isSelected={selectedClients.includes(client.id)}
                  onSelect={(clientId, checked) => handleSelectClient(clientId, checked)}
                  onClick={() => handleClientClick(client.id)}
                  onDoubleClick={() => handleClientDoubleClick(client.id)}
                  onViewProfile={onViewProfile}
                  isHighlighted={selectedClientId === client.id}
                />
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchQuery ? 'Aucun client trouvé pour cette recherche' : 'Aucun client trouvé'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* ✅ Informations de pagination et statistiques - comme OrdersTable */}
      <div className="flex flex-col items-center py-4 px-2 space-y-2">
        {/* Statistiques avec indicateur de chargement */}
        <div className="text-sm text-gray-600 flex items-center gap-2">
          {!actualLoading && totalItems > 0 && (
            <span className="text-xs">
              {totalItems} client{totalItems > 1 ? "s" : ""} au total
            </span>
          )}

          {actualLoading && (
            <div className="flex items-center gap-1 text-primary-500">
              <div className="w-3 h-3 border border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Chargement...</span>
            </div>
          )}
        </div>

        {/* Pagination - Toujours affichée, même avec 1 seule page */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, totalPages)}
          onPageChange={handlePageChange}
          isLoading={actualLoading}
        />
      </div>
    </div>
  )
}