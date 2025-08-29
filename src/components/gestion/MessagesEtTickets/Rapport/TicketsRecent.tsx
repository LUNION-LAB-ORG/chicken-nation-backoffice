"use client";

import React from 'react';
import Image from 'next/image';

// Types pour les données mockées
interface TicketData {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  assignedTo: {
    name: string;
    avatar: string;
  };
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

// Données mockées
const mockTickets: TicketData[] = [
  {
    id: '1',
    title: 'Commande froide',
    subtitle: 'Demande de remboursement',
    category: 'Qualité produit',
    assignedTo: {
      name: 'Ahmed Hassan',
      avatar: '/icons/imageprofile.png'
    },
    priority: 'HIGH',
    timestamp: 'il y a 2 minutes'
  },
  {
    id: '2',
    title: 'Problème de livraison',
    subtitle: 'Adresse introuvable',
    category: 'Livraison',
    assignedTo: {
      name: 'Marie Dubois',
      avatar: '/icons/imageprofile.png'
    },
    priority: 'MEDIUM',
    timestamp: 'il y a 20 minutes'
  }
];

// Composant pour un ticket individuel
interface TicketItemProps {
  ticket: TicketData;
}

function TicketItem({ ticket }: TicketItemProps) {
  const getPriorityBadge = () => {
    if (ticket.priority === 'HIGH') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-red-500 text-white">
          HIGH
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-gray-100 text-slate-700">
          MEDIUM
        </span>
      );
    }  
  };

  return (
    <div className="py-1 ">
      <div className="flex items-center space-x-4">
        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          {/* Header avec titre et priorité */} 
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <div className="flex items-center">
                <h4 className="md:text-sm lg:text-sm text-xs font-semibold text-gray-900 leading-tight">
                  {ticket.title}
                  {ticket.subtitle && (
                    <span className="font-normal"> - {ticket.subtitle}</span>
                  )}
                </h4>
              </div>
            </div>
            <div className="flex flex-col items-end justify-start ml-4 space-y-2">
              {getPriorityBadge()}
              <p className="md:text-[10px] lg:text-sm text-[10px] text-gray-400">{ticket.timestamp}</p>
            </div>
          </div>

          {/* Footer avec catégorie et assigné */}
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium border-gray-200 border-1 text-gray-700 w-fit">
              {ticket.category}
            </span>
            <div className="flex items-center space-x-2">
              <Image
                src={ticket.assignedTo.avatar}
                alt={ticket.assignedTo.name}
                width={16}
                height={16}
                className="w-4 h-4 rounded-full flex-shrink-0"
              />
              <span className="md:text-[10px] lg:text-sm text-[10px] text-gray-500 truncate">{ticket.assignedTo.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketsRecent() {
  return (
    <div className="bg-white rounded-2xl border-0 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="lg:text-2xl md:text-base text-md font-semibold text-gray-900 flex items-center">
            <Image
              src="/icons/rapport/ticket-dark.png"
              alt="Tickets"
              width={20}
              height={20}
              className="mr-2 self-center mt-1"
            />
            Tickets récents
          </h3>
           <button className="md:text-xs text-xs border-1 border-slate-400 md:p-1.5 p-1 px-2 md:px-2.5 cursor-pointer rounded-xl text-gray-600 hover:text-gray-800 font-medium">
            Voir tout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-3">
          {mockTickets.map((ticket) => (
            <TicketItem 
              key={ticket.id} 
              ticket={ticket} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TicketsRecent;
