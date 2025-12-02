'use client'

import React, { useState } from 'react';
import ClientHeader from './ClientHeader';
import { ClientsTable } from './ClientsTable';
import { ClientProfile } from './ClientProfile';
import AddMenu from '../Menus/AddMenu';
import { UserCounter } from './UserCounter';
import { GlobalReviews } from './GlobalReviews';
import { useAuthStore } from '@/store/authStore';
import { useCustomersCount } from '@/hooks/useCustomersQuery';

interface ClientState {
  view: 'list' | 'create' | 'edit' | 'view' | 'reviews';
  selectedClientId?: string | null;
  showConnectedOnly: boolean;
}

interface ClientsProps {
  setActiveTab?: (tab: string) => void;
}

interface ClientsProps {
  setActiveTab?: (tab: string) => void;
}

export default function Clients({ setActiveTab }: ClientsProps) {
  const { user } = useAuthStore(); // ✅ Récupérer l'utilisateur connecté

  const [clientState, setClientState] = useState<ClientState>({
    view: 'list',
    selectedClientId: null,
    showConnectedOnly: false
  });

  // État pour la recherche
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Déterminer le restaurantId pour les managers de restaurant
  const isRestaurantManager = user?.role === 'MANAGER' || user?.role === 'CAISSIER' || user?.role === 'CALL_CENTER' || user?.role === 'CUISINE';
  const restaurantId = isRestaurantManager ? user.restaurant_id : undefined;

  // ✅ Utiliser le hook spécialisé pour le comptage
  const { totalCount: clientsCount, hasAccurateCount } = useCustomersCount({
    restaurantId
  });

  const handleViewChange = (view: 'list' | 'create' | 'edit' | 'view' | 'reviews', clientId?: string | null) => {
    setClientState(prev => ({ ...prev, view, selectedClientId: clientId }));
  };

  const handleClientSelect = (clientId: string) => {
    if (clientState.selectedClientId === clientId) {
      setClientState(prev => ({ ...prev, selectedClientId: null }));
    } else {
      setClientState(prev => ({ ...prev, selectedClientId: clientId }));
    }
  };

  const handleClientDoubleClick = (clientId: string) => {
    handleViewChange('view', clientId);
  };

  const handleBack = () => {
    handleViewChange('list');
  };

  const handleViewReviews = () => {
    if (clientState.view === 'list' && clientState.selectedClientId) {
      handleViewChange('view', clientState.selectedClientId);
    } else {
      handleViewChange('reviews');
    }
  };

  const toggleConnectedFilter = () => {
    setClientState(prev => ({
      ...prev,
      showConnectedOnly: !prev.showConnectedOnly,
      selectedClientId: null
    }));
  };

  const handleViewOrders = () => {
    if (setActiveTab) {
      setActiveTab('orders');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <ClientHeader
          currentView={clientState.view}
          selectedClientId={clientState.selectedClientId}
          onBack={clientState.view !== 'list' ? handleBack : undefined}
          onViewReviews={handleViewReviews}
          onToggleConnected={toggleConnectedFilter}
          showingConnectedOnly={clientState.showConnectedOnly}
          onViewOrders={handleViewOrders}
          onSearch={handleSearch}
        />

        {clientState.view === 'list' && (
          <UserCounter count={clientsCount} />
        )}
      </div>

      {clientState.view === 'list' && (
        <div className='bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden min-h-[600px]'>
          <ClientsTable
            selectedClientId={clientState.selectedClientId}
            onClientClick={handleClientSelect}
            onClientDoubleClick={handleClientDoubleClick}
            onViewProfile={(clientId) => {
              handleViewChange('view', clientId);
            }}
            connectedOnly={clientState.showConnectedOnly}
            searchQuery={searchQuery}
            restaurantId={restaurantId}
          />
        </div>
      )}

      {clientState.view === 'view' && clientState.selectedClientId && (
        <ClientProfile
          clientId={clientState.selectedClientId}
          onClose={handleBack}
        />
      )}

      {clientState.view === 'create' && (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 lg:w-2/3">
            <AddMenu onCancel={handleBack} />
          </div>
          <div className="w-full lg:w-1/3 invisible">
          </div>
        </div>
      )}

      {clientState.view === 'reviews' && (
        <GlobalReviews />
      )}
    </div>
  );
}