"use client";

import React from 'react';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';

interface TicketsRightbarProps {
  ticketId: string;
}

// Données mockées pour les détails du ticket
const getTicketDetails = (ticketId: string) => {
  const ticketDetails = {
    'ticket-1': {
      client: {
        name: 'Lucas Bernard',
        email: 'l.bernard@email.com',
        avatar: '/icons/imageprofile.png'
      },
      assignee: {
        name: 'Marie Dubois',
        role: 'Manager',
        initials: 'MD'
      },
      createdAt: '24/08/2025 19:47',
      firstResponse: '24/08/2025 19:52',
      lastUpdate: 'il y a 20 minutes'
    },
    'ticket-2': {
      client: {
        name: 'Marie Sophie',
        email: 'm.sophie@email.com',
        avatar: '/icons/imageprofile.png'
      },
      assignee: {
        name: 'Ahmed Hassan',
        role: 'Support Level 1',
        initials: 'AH'
      },
      createdAt: '27/08/2025 14:10',
      firstResponse: '27/08/2025 14:15',
      lastUpdate: 'il y a 10 minutes'
    },
    'ticket-3': {
      client: {
        name: 'Jean Martin',
        email: 'j.martin@email.com',
        avatar: '/icons/imageprofile.png'
      },
      assignee: {
        name: 'Fatou Diallo',
        role: 'Manager',
        initials: 'FD'
      },
      createdAt: '26/08/2025 16:30',
      firstResponse: '26/08/2025 16:35',
      lastUpdate: 'il y a 1 heure'
    }
  };

  return ticketDetails[ticketId as keyof typeof ticketDetails] || ticketDetails['ticket-1'];
};

function TicketsRightbar({ ticketId }: TicketsRightbarProps) {
  const ticket = getTicketDetails(ticketId);

  return (
    <div className="w-80 bg-gray-50 border-l border-slate-300 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Client Section */}
        <div className=' lg:ml-3 ml-0'>
          <h3 className="text-orange-500 font-semibold text-lg mb-4">Client</h3>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
              <Image
                src={ticket.client.avatar}
                alt={ticket.client.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-base">
                {ticket.client.name}
              </div>
              <div className="text-gray-500 text-sm">
                {ticket.client.email}
              </div>
            </div>
          </div>
        </div>

        {/* Assigné à Section */}
        <div className='lg:ml-3 ml-0'>
          <h3 className="text-orange-500 font-semibold text-lg mb-4 ">Assigné à</h3>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-700 font-medium text-sm">
                {ticket.assignee.initials}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900 text-base">
                {ticket.assignee.name}
              </div>
              <div className="text-gray-500 text-sm">
                {ticket.assignee.role}
              </div>
            </div>
          </div>
        </div>

        {/* Historique Section */}
        <div>
          <h3 className="text-orange-500 font-semibold text-lg mb-4">Historique</h3>
          <div className="space-y-4">
            {/* Créé */}
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm font-medium">Créé:</span>
                  <span className="text-gray-700 text-sm">{ticket.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Première réponse */}
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm font-medium">Première réponse:</span>
                  <span className="text-gray-700 text-sm">{ticket.firstResponse}</span>
                </div>
              </div>
            </div>

            {/* Dernière maj */}
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm font-medium">Dernière maj:</span>
                  <span className="text-gray-700 text-sm">{ticket.lastUpdate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketsRightbar;
