"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, MessageCircle } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

// Types pour les tickets
interface Ticket {
  id: string;
  title: string;
  client: {
    name: string;
    avatar: string;
  };
  agent: {
    name: string;
    initials: string;
  };
  category: string;
  status: 'Ouvert' | 'En cours' | 'Résolu';
  priority: 'Élevé' | 'Moyen' | 'Urgent';
  timestamp: string;
  conversationRef?: string;
}

// Données mockées pour les tickets
const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    title: 'Commande froide - Demande de remboursement',
    client: {
      name: 'Karima Traoré',
      avatar: '/icons/imageprofile.png'
    },
    agent: {
      name: 'Ahmed',
      initials: 'A'
    },
    category: 'Qualité produit',
    status: 'Ouvert',
    priority: 'Élevé',
    timestamp: 'il y a 2 minutes',
    conversationRef: 'conv #1'
  },
  {
    id: 'ticket-2',
    title: 'Problème de livraison - Adresse introuvable',
    client: {
      name: 'Marie',
      avatar: '/icons/imageprofile.png'
    },
    agent: {
      name: 'Lucas Bernard',
      initials: 'MD'
    },
    category: 'Livraison',
    status: 'En cours',
    priority: 'Moyen',
    timestamp: 'il y a 20 minutes'
  },
  {
    id: 'ticket-3',
    title: 'Allergie non prise en compte',
    client: {
      name: 'Marie',
      avatar: '/icons/imageprofile.png'
    },
    agent: {
      name: 'Fatou Diallo',
      initials: 'MD'
    },
    category: 'Sécurité alimentaire',
    status: 'Résolu',
    priority: 'Urgent',
    timestamp: 'il y a environ 1 heure'
  }
];

interface TicketsSidebarProps {
  selectedTicket: string | null;
  onSelectTicket: (id: string | null) => void;
}

function TicketsSidebar({ selectedTicket, onSelectTicket }: TicketsSidebarProps) {
  // États pour les filtres
  const [selectedStatus, setSelectedStatus] = useState('Tous les statuts');
  const [selectedPriority, setSelectedPriority] = useState('Toutes priorités');

  // Options pour les dropdowns
  const statusOptions = [
    { value: 'Tous les statuts', label: 'Tous les statuts' },
    { value: 'Ouvert', label: 'Ouvert' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Résolu', label: 'Résolu' }
  ];

  const priorityOptions = [
    { value: 'Toutes priorités', label: 'Toutes priorités' },
    { value: 'Urgent', label: 'Urgent' },
    { value: 'Élevé', label: 'Élevé' },
    { value: 'Moyen', label: 'Moyen' },
    { value: 'Faible', label: 'Faible' }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 md:p-6 border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="lg:text-2xl md:text-lg text-base font-bold text-orange-500">Tickets</h1>
        </div>
        
        {/* Search */}
        <div className="relative mb-4 md:mb-6">
          <div className="absolute inset-y-0 left-0 md:pl-4 pl-3 flex items-center pointer-events-none">
            <Search className="md:h-5 md:w-5 h-4 w-4 text-gray-600" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un ticket..."
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
        {mockTickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket.id)}
            className={`md:px-4 md:py-4 px-3 py-3 border-b border-slate-300 cursor-pointer hover:bg-gray-50 ${
              selectedTicket === ticket.id ? 'bg-orange-50' : ''
            }`}
          >
            <div className="mb-3">
              {/* Titre et badges */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="md:text-base text-sm font-medium text-gray-900 flex-1 pr-4 leading-relaxed">
                  {ticket.title}
                </h3>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full md:text-sm text-xs font-medium ${
                    ticket.status === 'Ouvert'
                      ? 'bg-red-500 text-white'
                      : ticket.status === 'En cours'
                      ? 'bg-orange-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}>
                    {ticket.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full md:text-sm text-xs font-medium ${
                    ticket.priority === 'Urgent'
                      ? 'bg-red-500 text-white'
                      : ticket.priority === 'Élevé'
                      ? 'bg-orange-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
              
              {/* Agent et Client */}
              <div className="flex items-center space-x-3 mb-3">
                {/* Avatar agent simple */}
                <div className="md:w-12 md:h-12 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Image
                    src={ticket.client.avatar}
                    alt={ticket.agent.name}
                    width={40}
                    height={40}
                    className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                  />
                </div>
                
                {/* Noms - Agent • Client */}
                <div className="flex items-center space-x-1 text-gray-600">
                  <span className="md:text-sm text-xs font-medium">{ticket.agent.name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="md:text-sm text-xs">{ticket.client.name}</span>
                </div>
              </div>
              
              {/* Catégorie et référence conversation */}
              <div className="flex items-center justify-between">
                <span className="border-gray-200 border-1 text-gray-700 md:px-3 md:py-1 px-2 py-0.5 rounded-full md:text-sm text-xs font-medium">
                  {ticket.category}
                </span>
                
                <div className="flex items-center space-x-2 text-gray-500">
                  {ticket.conversationRef && (
                    <>
                      <MessageCircle className="md:w-4 md:h-4 w-3 h-3" />
                      <span className="md:text-sm text-xs">{ticket.conversationRef}</span>
                    </>
                  )}
                  <span className="md:text-sm text-xs">{ticket.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TicketsSidebar;
