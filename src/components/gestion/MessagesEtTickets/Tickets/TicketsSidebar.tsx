"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, MessageCircle, Plus, Loader2 } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { useTicketsQuery } from '@/hooks/useTicketsQuery';
import { useTicketCategoriesQuery } from '@/hooks/useTicketCategoriesQuery';
import { Ticket, TicketStatus, TicketPriority } from '@/types/tickets';
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/types/tickets';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TicketsSidebarProps {
  selectedTicket: string | null;
  onSelectTicket: (id: string | null) => void;
  onNewTicket?: () => void;
  onNewCategory?: () => void;
}

function TicketsSidebar({ selectedTicket, onSelectTicket, onNewTicket, onNewCategory }: TicketsSidebarProps) {
  // États pour les filtres
  const [selectedStatus, setSelectedStatus] = useState('Tous les statuts');
  const [selectedPriority, setSelectedPriority] = useState('Toutes priorités');
  const [searchQuery, setSearchQuery] = useState('');

  // Fonction pour mapper les valeurs de filtre aux valeurs API
  const mapFilterValue = (filterType: 'status' | 'priority', value: string) => {
    // Les valeurs des dropdowns sont déjà les valeurs API, pas besoin de mapping
    return value as TicketStatus | TicketPriority;
  };

  // Construire les filtres pour l'API
  const filters = {
    status: selectedStatus !== 'Tous les statuts' ? [mapFilterValue('status', selectedStatus) as TicketStatus] : undefined,
    priority: selectedPriority !== 'Toutes priorités' ? [mapFilterValue('priority', selectedPriority) as TicketPriority] : undefined,
    search: searchQuery || undefined,
  };

  // Récupérer les tickets avec les filtres
  const { data: ticketsData, isLoading: ticketsLoading, error: ticketsError } = useTicketsQuery(filters);

  // Récupérer les catégories pour les afficher
  const { data: categoriesData } = useTicketCategoriesQuery({ status: 'ACTIVE' });

  const tickets = ticketsData?.data || [];
  const categories = categoriesData?.data || [];

  // Options pour les dropdowns
  const statusOptions = [
    { value: 'Tous les statuts', label: 'Tous les statuts' },
    { value: 'OPEN', label: TICKET_STATUS_LABELS.OPEN },
    { value: 'IN_PROGRESS', label: TICKET_STATUS_LABELS.IN_PROGRESS },
    { value: 'RESOLVED', label: TICKET_STATUS_LABELS.RESOLVED },
    { value: 'CLOSED', label: TICKET_STATUS_LABELS.CLOSED }
  ];

  const priorityOptions = [
    { value: 'Toutes priorités', label: 'Toutes priorités' },
    { value: 'URGENT', label: TICKET_PRIORITY_LABELS.URGENT },
    { value: 'HIGH', label: TICKET_PRIORITY_LABELS.HIGH },
    { value: 'MEDIUM', label: TICKET_PRIORITY_LABELS.MEDIUM },
    { value: 'LOW', label: TICKET_PRIORITY_LABELS.LOW }
  ];

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-500 text-white';
      case 'IN_PROGRESS':
        return 'bg-orange-500 text-white';
      case 'RESOLVED':
        return 'bg-green-500 text-white';
      case 'CLOSED':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Fonction pour obtenir la couleur de priorité
  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Fonction pour formater le timestamp
  const formatTimestamp = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch {
      return 'Date inconnue';
    }
  };

  // Fonction pour obtenir le nom de la catégorie
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Catégorie inconnue';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 md:p-6 border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="lg:text-2xl md:text-lg text-base font-bold text-orange-500">Tickets</h1>
          <div className="flex items-center space-x-2">
            {onNewCategory && (
              <button
                onClick={onNewCategory}
                title="Créer une catégorie"
                className="flex items-center space-x-1 bg-yellow-500 text-white px-2 py-2 cursor-pointer rounded-xl hover:bg-yellow-600 transition-colors text-xs"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden lg:inline">Catégorie</span>
              </button>
            )}
            {onNewTicket && (
              <button
                onClick={onNewTicket}
                className="flex items-center space-x-2 bg-orange-500 text-white px-3 py-2 cursor-pointer rounded-xl hover:bg-orange-600 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4 md:mb-6">
          <div className="absolute inset-y-0 left-0 md:pl-4 pl-3 flex items-center pointer-events-none">
            <Search className="md:h-5 md:w-5 h-4 w-4 text-gray-600" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un ticket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full md:pl-12 pl-10 md:pr-4 pr-3 md:py-3 py-2.5 border border-gray-200 rounded-xl md:text-sm text-xs placeholder-gray-600 focus:outline-none focus:ring-2 cursor-pointer focus:ring-orange-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 md:gap-3 mb-4 md:mb-2">
          <div className="flex-1">
            <CustomDropdown
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Filtrer par statut"
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <CustomDropdown
              options={priorityOptions}
              value={selectedPriority}
              onChange={setSelectedPriority}
              placeholder="Filtrer par priorité"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto">
        {ticketsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Chargement des tickets...</span>
          </div>
        ) : ticketsError ? (
          <div className="p-4 text-center text-red-600">
            <p>Erreur lors du chargement des tickets</p>
            <p className="text-sm text-gray-500 mt-1">Vérifiez votre connexion</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>Aucun ticket trouvé</p>
            <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
              className={`md:px-4 md:py-4 px-3 py-3 border-b border-slate-300 cursor-pointer hover:bg-gray-50 ${selectedTicket === ticket.id ? 'bg-orange-50' : ''
                }`}
            >
              <div className="mb-3">
                {/* Titre et badges */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="md:text-base text-sm font-medium text-gray-900 flex-1 pr-4 leading-relaxed">
                    {ticket.order?.reference || ticket.code} - {ticket.category?.name}
                  </h3>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full md:text-sm text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {TICKET_STATUS_LABELS[ticket.status]}
                    </span>
                    <span className={`px-3 py-1 rounded-full md:text-sm text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {TICKET_PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </div>
                </div>

                {/* Client et Agent */}
                <div className="flex items-center space-x-3 mb-3">
                  {/* Avatar client */}
                  <div className="md:w-12 md:h-12 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {ticket.customer?.image && ticket.customer.image.trim() !== '' ? (
                      <Image
                        src={`https://chicken.turbodeliveryapp.com/${ticket.customer.image}`}
                        alt={ticket.customer?.name || 'Client'}
                        width={40}
                        height={40}
                        className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium text-sm">
                        {ticket.customer?.first_name?.[0] || ticket.customer?.name?.[0] || 'C'}
                      </span>
                    )}
                  </div>

                  {/* Noms - Agent • Client */}
                  <div className="flex items-center space-x-1 text-gray-600">
                    <span className="md:text-sm text-xs font-medium">
                      {ticket.assignee?.name || 'Non assigné'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="md:text-sm text-xs">
                      {ticket.customer ? ticket.customer.name : 'Client inconnu'}
                    </span>
                  </div>
                </div>

                {/* Catégorie et référence conversation */}
                <div className="flex items-center justify-between">
                  <span className="border-gray-200 border-1 text-gray-700 md:px-3 md:py-1 px-2 py-0.5 rounded-full md:text-sm text-xs font-medium">
                    {ticket.category?.name || 'Catégorie inconnue'}
                  </span>

                  <div className="flex items-center space-x-2 text-gray-500">
                    {ticket.order?.reference && (
                      <>
                        <MessageCircle className="md:w-4 md:h-4 w-3 h-3" />
                        <span className="md:text-sm text-xs">{ticket.order.reference}</span>
                      </>
                    )}
                    <span className="md:text-sm text-xs">
                      {ticket.messages && ticket.messages.length > 0 
                        ? `${ticket.messages.length} message${ticket.messages.length > 1 ? 's' : ''}`
                        : 'Nouveau ticket'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TicketsSidebar;