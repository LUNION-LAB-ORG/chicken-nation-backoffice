"use client";

import React from 'react';
import Image from 'next/image';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { useTicketQuery } from '@/hooks/useTicketsQuery';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TicketsRightbarProps {
  ticketId: string;
}

function TicketsRightbar({ ticketId }: TicketsRightbarProps) {
  // Récupération des données du ticket via l'API
  const { data: ticket, isLoading, error } = useTicketQuery(ticketId);

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch {
      return 'Date inconnue';
    }
  };

  // Fonction pour formater le temps relatif
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch {
      return 'Date inconnue';
    }
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-gray-50 border-l border-slate-300 flex items-center justify-center h-full">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="w-80 bg-gray-50 border-l border-slate-300 flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Erreur lors du chargement</p>
          <p className="text-sm mt-1">Impossible de charger les détails</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-l border-slate-300 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Client Section */}
        <div className=' lg:ml-3 ml-0'>
          <h3 className="text-orange-500 font-semibold text-lg mb-4">Client</h3>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {ticket.customer?.image && ticket.customer.image.trim() !== '' ? (
                <Image
                  src={`https://chicken.turbodeliveryapp.com/${ticket.customer.image}`}
                  alt={ticket.customer.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium">
                  {ticket.customer?.first_name?.[0] || ticket.customer?.name?.[0] || 'C'}
                </span>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 text-base">
                {ticket.customer?.name || 'Client inconnu'}
              </div>
              <div className="text-gray-500 text-sm">
                {ticket.customer?.email || 'Email non renseigné'}
              </div>
            </div>
          </div>
        </div>

        {/* Assigné à Section */}
        <div className='lg:ml-3 ml-0'>
          <h3 className="text-orange-500 font-semibold text-lg mb-4 ">Assigné à</h3>
          <div className="flex items-center space-x-4">
            {ticket.assignee ? (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  {ticket.assignee.image && ticket.assignee.image.trim() !== '' ? (
                    <Image
                      src={ticket.assignee.image.startsWith('http') ? ticket.assignee.image : `https://chicken.turbodeliveryapp.com/${ticket.assignee.image}`}
                      alt={ticket.assignee.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-700 font-medium text-sm">
                      {ticket.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-base">
                    {ticket.assignee.name}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {ticket.assignee.role || 'Agent'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 font-medium text-sm">?</span>
                </div>
                <div>
                  <div className="font-medium text-gray-500 text-base">
                    Non assigné
                  </div>
                  <div className="text-gray-400 text-sm">
                    En attente d'assignation
                  </div>
                </div>
              </>
            )}
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
                  <span className="text-gray-700 text-sm">{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Code du ticket */}
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm font-medium">Code:</span>
                  <span className="text-gray-700 text-sm font-mono">{ticket.code}</span>
                </div>
              </div>
            </div>

            {/* Dernière activité */}
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm font-medium">Dernière activité:</span>
                  <span className="text-gray-700 text-sm">{formatRelativeTime(ticket.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Nombre de messages */}
            {ticket.messages && (
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 text-sm font-medium">Messages:</span>
                    <span className="text-gray-700 text-sm">{ticket.messages.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketsRightbar;
