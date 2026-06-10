"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, MessageCircle, Plus, Loader2, Bike, User as UserIcon, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { useTicketListQuery } from '../../../../../features/messagerie';
import { useTicketCategoriesQuery } from '@/hooks/useTicketCategoriesQuery';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  type TicketSource,
  getTicketSource,
} from '@/types/tickets';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatImageUrl } from '@/utils/imageHelpers';

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
  // P-chat livreur : tabs filtre origine du ticket
  const [sourceFilter, setSourceFilter] = useState<TicketSource | 'ALL'>('ALL');

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
  const { data: ticketsData, isLoading: ticketsLoading, error: ticketsError } = useTicketListQuery(filters);

  // Récupérer les catégories pour les afficher
  const { data: categoriesData } = useTicketCategoriesQuery({ status: 'ACTIVE' });

  const allTickets = ticketsData?.data || [];
  // Filtrage côté client par origine (pas encore exposé via filtre backend)
  const tickets = sourceFilter === 'ALL'
    ? allTickets
    : allTickets.filter((t) => getTicketSource(t as Ticket) === sourceFilter);
  const categories = categoriesData?.data || [];

  // ===== Regroupement par commande / demandeur =====
  // Les tickets d'une même commande (ou, à défaut, d'un même client/livreur)
  // sont regroupés en un groupe dépliable. Les groupes d'un seul ticket
  // s'affichent à plat (pas d'en-tête superflu).
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const ticketGroups = useMemo(() => {
    type TicketItem = (typeof tickets)[number];
    const map = new Map<string, { key: string; label: string; isOrder: boolean; tickets: TicketItem[] }>();
    for (const t of tickets) {
      const orderRef = t.order?.reference;
      const requester = (t as Ticket).deliverer || t.customer;
      const key = orderRef
        ? `order-${orderRef}`
        : `req-${requester?.id || t.id}`;
      const label = orderRef || requester?.name || 'Sans commande';
      const existing = map.get(key);
      if (existing) {
        existing.tickets.push(t);
      } else {
        map.set(key, { key, label, isOrder: !!orderRef, tickets: [t] });
      }
    }
    return [...map.values()];
  }, [tickets]);

  // Un groupe est ouvert si l'utilisateur l'a basculé, sinon s'il contient le ticket sélectionné
  const isGroupExpanded = (group: { key: string; tickets: { id: string }[] }) =>
    expandedGroups[group.key] ?? group.tickets.some((t) => t.id === selectedTicket);

  const toggleGroup = (group: { key: string; tickets: { id: string }[] }) =>
    setExpandedGroups((prev) => ({ ...prev, [group.key]: !isGroupExpanded(group) }));

  // Compteurs pour les tabs source
  const counts = {
    ALL: allTickets.length,
    CUSTOMER: allTickets.filter((t) => getTicketSource(t as Ticket) === 'CUSTOMER').length,
    DELIVERER: allTickets.filter((t) => getTicketSource(t as Ticket) === 'DELIVERER').length,
  };

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
        return 'bg-[#F17922] text-white';
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
      case 'HIGH':
        return 'bg-red-500 text-white';
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

  // Carte ticket (réutilisée à plat et dans les groupes dépliables)
  const renderTicketCard = (ticket: (typeof tickets)[number], inGroup = false) => (
    <div
      key={ticket.id}
      onClick={() => onSelectTicket(ticket.id)}
      className={`cursor-pointer hover:bg-gray-50 ${
        inGroup
          ? 'md:pl-8 pl-6 md:pr-4 pr-3 md:py-3 py-2.5 border-b border-slate-200 last:border-b-0'
          : 'md:px-4 md:py-4 px-3 py-3 border-b border-slate-300'
      } ${selectedTicket === ticket.id ? 'bg-orange-50' : ''}`}
    >
      <div className={inGroup ? 'mb-1' : 'mb-3'}>
        {/* Titre et badges */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="md:text-base text-sm font-medium text-gray-900 flex-1 pr-4 leading-relaxed">
            {inGroup
              ? ticket.category?.name || ticket.code
              : `${ticket.order?.reference || ticket.code} - ${ticket.category?.name}`}
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

        {/* Demandeur (client OU livreur) et Agent */}
        {(() => {
          const ticketSource = getTicketSource(ticket as Ticket);
          const isDeliverer = ticketSource === 'DELIVERER';
          const requester = isDeliverer ? ticket.deliverer : ticket.customer;
          return (
            <div className="flex items-center space-x-3 mb-3">
              {/* Avatar demandeur avec badge type (livreur = orange, client = bleu) */}
              <div className="relative">
                <div className={`${inGroup ? 'md:w-9 md:h-9 w-8 h-8' : 'md:w-12 md:h-12 w-10 h-10'} rounded-full flex items-center justify-center ${
                  isDeliverer ? 'bg-orange-100' : 'bg-gray-200'
                }`}>
                  {requester?.image && requester.image.trim() !== '' ? (
                    <Image
                      src={formatImageUrl(requester.image)}
                      alt={requester?.name || (isDeliverer ? 'Livreur' : 'Client')}
                      width={40}
                      height={40}
                      className={`${inGroup ? 'md:w-8 md:h-8 w-7 h-7' : 'md:w-10 md:h-10 w-8 h-8'} rounded-full object-cover`}
                    />
                  ) : (
                    <span className={`font-medium text-sm ${isDeliverer ? 'text-orange-700' : 'text-gray-600'}`}>
                      {requester?.first_name?.[0] || requester?.name?.[0] || (isDeliverer ? 'L' : 'C')}
                    </span>
                  )}
                </div>
                {/* Badge type en bas-droite de l'avatar */}
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${
                    isDeliverer ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  title={isDeliverer ? 'Ticket livreur' : 'Ticket client'}
                >
                  {isDeliverer ? (
                    <Bike className="w-2 h-2 text-white" />
                  ) : (
                    <UserIcon className="w-2 h-2 text-white" />
                  )}
                </div>
              </div>

              {/* Noms - Agent • Demandeur + label type */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center space-x-1 text-gray-600">
                  <span className="md:text-sm text-xs font-medium">
                    {ticket.assignee?.name || 'Non assigné'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="md:text-sm text-xs truncate">
                    {requester ? requester.name : (isDeliverer ? 'Livreur inconnu' : 'Client inconnu')}
                  </span>
                </div>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDeliverer ? 'text-orange-600' : 'text-blue-600'
                  }`}
                >
                  {isDeliverer ? 'Ticket livreur' : 'Ticket client'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Catégorie et référence conversation */}
        <div className="flex items-center justify-between">
          <span className="border-gray-200 border-1 text-gray-700 md:px-3 md:py-1 px-2 py-0.5 rounded-full md:text-sm text-xs font-medium">
            {ticket.category?.name || 'Catégorie inconnue'}
          </span>

          <div className="flex items-center space-x-2 text-gray-500">
            <MessageCircle className="md:w-4 md:h-4 w-3 h-3" />
            <span className="md:text-sm text-xs">
              {ticket.messages && ticket.messages.length > 0
                ? `${ticket.messages.length} message${ticket.messages.length > 1 ? 's' : ''}`
                : 'Nouveau ticket'
              }
            </span>
            {ticket.unreadCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-semibold bg-red-500 text-white">
                {ticket.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 md:p-6 border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="lg:text-2xl md:text-lg text-base font-bold text-[#F17922]">Tickets</h1>
          <div className="flex items-center space-x-2">
            {onNewCategory && (
              <button
                onClick={onNewCategory}
                title="Créer une catégorie"
                className="flex items-center space-x-2 bg-[#F17922] text-white px-3 py-2 cursor-pointer rounded-xl hover:bg-orange-600 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">Créer une catégorie</span>
              </button>
            )}
            {onNewTicket && (
              <button
                onClick={onNewTicket}
                className="flex items-center space-x-2 bg-[#F17922] text-white px-3 py-2 cursor-pointer rounded-xl hover:bg-orange-600 transition-colors text-sm"
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
            className="block w-full md:pl-12 pl-10 md:pr-4 pr-3 md:py-3 py-2.5 border border-gray-200 rounded-xl md:text-sm text-xs placeholder-gray-600 focus:outline-none focus:ring-2 cursor-pointer focus:ring-[#F17922] focus:border-transparent bg-white"
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

        {/* P-chat livreur : tabs filtre par origine du ticket */}
        <div className="flex items-center gap-1 mt-3 bg-gray-100 rounded-lg p-1">
          {([
            { key: 'ALL', label: 'Tous', icon: null },
            { key: 'CUSTOMER', label: 'Clients', icon: UserIcon },
            { key: 'DELIVERER', label: 'Livreurs', icon: Bike },
          ] as const).map((tab) => {
            const isActive = sourceFilter === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSourceFilter(tab.key)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  isActive
                    ? 'bg-white text-[#F17922] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {tab.label}
                <span className={`text-[10px] ${isActive ? 'text-[#F17922]/70' : 'text-gray-400'}`}>
                  ({counts[tab.key]})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto">
        {ticketsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
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
          ticketGroups.map((group) => {
            // Groupe d'un seul ticket → affichage à plat (comme avant)
            if (group.tickets.length === 1) {
              return renderTicketCard(group.tickets[0]);
            }

            const expanded = isGroupExpanded(group);
            const unreadTotal = group.tickets.reduce((s, t) => s + (t.unreadCount || 0), 0);
            const openCount = group.tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

            return (
              <div key={group.key} className="border-b border-slate-300">
                {/* En-tête de groupe (commande ou demandeur) */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className={`w-full flex items-center gap-2.5 md:px-4 px-3 md:py-3 py-2.5 text-left cursor-pointer transition-colors ${
                    expanded ? 'bg-orange-50/60' : 'hover:bg-gray-50'
                  }`}
                >
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-[#F17922] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    group.isOrder ? 'bg-orange-100' : 'bg-blue-50'
                  }`}>
                    {group.isOrder ? (
                      <Receipt className="w-3.5 h-3.5 text-[#F17922]" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="md:text-sm text-xs font-semibold text-gray-900 truncate">
                      {group.label}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {group.tickets.length} tickets
                      {openCount > 0 ? ` · ${openCount} en cours` : ' · tous clos'}
                    </p>
                  </div>
                  {unreadTotal > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-semibold bg-red-500 text-white shrink-0">
                      {unreadTotal}
                    </span>
                  )}
                </button>

                {/* Tickets du groupe */}
                {expanded && (
                  <div className="bg-gray-50/40 border-l-2 border-orange-200 ml-4">
                    {group.tickets.map((t) => renderTicketCard(t, true))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TicketsSidebar;