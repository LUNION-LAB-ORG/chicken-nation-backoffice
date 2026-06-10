"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Ticket, ArrowLeft, Eye, EyeOff, Send, Loader2, Tag, ShoppingBag, UserCheck, MessageSquare, Clock, User } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import {
  useTicketDetailQuery,
  useEnvoyerMessageTicketMutation,
  useAssignerTicketMutation,
  useModifierStatutTicketMutation,
  useModifierPrioriteTicketMutation,
} from '../../../../../features/messagerie';
import { ticketAPI } from '../../../../../features/messagerie/apis/ticket.api';
import { ticketKeyQuery, ticketStatsKeyQuery } from '../../../../../features/messagerie/queries/index.query';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../../features/users/hook/authStore';
import { formatImageUrl } from '@/utils/imageHelpers';

interface TicketViewProps {
  ticketId: string | null;
  onBack?: () => void;
}

// Styles cohérents des badges statut/priorité (4 états chacun, libellés FR).
const STATUS_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  OPEN: { label: 'Ouvert', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  IN_PROGRESS: { label: 'En cours', cls: 'bg-orange-50 text-[#F17922] border-orange-200', dot: 'bg-[#F17922]' },
  RESOLVED: { label: 'Résolu', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  CLOSED: { label: 'Fermé', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  HIGH: { label: 'Priorité élevée', cls: 'bg-red-50 text-red-700 border-red-200' },
  MEDIUM: { label: 'Priorité moyenne', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  LOW: { label: 'Priorité faible', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

// Types pour les messages


// Les données des tickets sont maintenant récupérées via l'API

function TicketView({ ticketId, onBack }: TicketViewProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'public' | 'internal'>('public');

  // États pour les dropdowns
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Récupération des données du ticket via l'API
  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useTicketDetailQuery(ticketId);

  // Récupération de l'utilisateur connecté
  const { user } = useAuthStore();

  // Mutations pour les messages et l'assignation
  const sendMessageMutation = useEnvoyerMessageTicketMutation();
  const assignTicketMutation = useAssignerTicketMutation();
  const updateStatusMutation = useModifierStatutTicketMutation();
  const updatePriorityMutation = useModifierPrioriteTicketMutation();
  const queryClient = useQueryClient();
  const markedReadRef = useRef<string | null>(null);

  // Marquer les messages comme lus quand on ouvre le ticket
  useEffect(() => {
    if (ticketId && ticketId !== markedReadRef.current) {
      markedReadRef.current = ticketId;
      ticketAPI.marquerLu(ticketId).then(() => {
        // Force immediate refetch (not just invalidation) so the badge updates instantly
        queryClient.refetchQueries({ queryKey: ticketStatsKeyQuery() });
        queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
        queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', ticketId) });
      }).catch(() => {
        // Reset ref so it retries on next render
        markedReadRef.current = null;
      });
    }
  }, [ticketId, queryClient]);

  // Trier les messages par ordre chronologique (anciens vers nouveaux)
  const sortedMessages = useMemo(() => {
    if (!ticket?.messages) return [];
    return [...ticket.messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [ticket?.messages]);

  // Initialiser les états avec les données du ticket
  useEffect(() => {
    if (ticket) {
      setSelectedStatus(ticket.status);
      setSelectedPriority(ticket.priority);
    }
  }, [ticket]);

  // Handler pour changer le statut
  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || !ticketId) return;
    
    try {
      setSelectedStatus(newStatus);
      await updateStatusMutation.mutateAsync({
        id: ticketId,
        status: newStatus as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      // Restaurer l'ancien statut en cas d'erreur
      setSelectedStatus(ticket.status);
    }
  };

  // Handler pour changer la priorité
  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket || !ticketId) return;
    
    try {
      setSelectedPriority(newPriority);
      await updatePriorityMutation.mutateAsync({
        id: ticketId,
        priority: newPriority as 'HIGH' | 'MEDIUM' | 'LOW'
      });
    } catch (error) {
      console.error('Erreur lors du changement de priorité:', error);
      // Restaurer l'ancienne priorité en cas d'erreur
      setSelectedPriority(ticket.priority);
    }
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async () => {
    if (!message.trim() || !user?.id || !ticketId) return;

    try {
      // Auto-assigner le ticket si nécessaire
      if (!ticket?.assignee || ticket.assignee.id !== user.id) {
        try {
          await assignTicketMutation.mutateAsync({ ticketId, assigneeId: user.id });
        } catch {
          // Continue même si l'assignation échoue
        }
      }

      await sendMessageMutation.mutateAsync({
        ticketId,
        data: {
          body: message,
          internal: messageType === 'internal',
          authorId: user.id,
          meta: 'dashboard',
        },
      });

      setMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  // Fonction pour gérer l'envoi avec Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Options pour les dropdowns - correspondant aux valeurs API
  const statusOptions = [
    { value: 'OPEN', label: 'Ouvert' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'RESOLVED', label: 'Résolu' },
    { value: 'CLOSED', label: 'Fermé' }
  ];

  const priorityOptions = [
    { value: 'HIGH', label: 'Élevée' },
    { value: 'MEDIUM', label: 'Moyenne' },
    { value: 'LOW', label: 'Faible' }
  ];

  // Assignation automatique lors de l'envoi de message (pas de dropdown pour l'instant)

  if (!ticketId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="mb-4">
          <Ticket className="w-16 h-16 mx-auto text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Sélectionnez un ticket</h3>
        <p className="text-sm text-gray-400">Choisissez un ticket dans la liste pour voir les détails</p>
      </div>
    );
  }

  // Gestion des états de chargement et d'erreur
  if (ticketLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F17922]"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Chargement du ticket...</h3>
      </div>
    );
  }

  if (ticketError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="mb-4">
          <Ticket className="w-16 h-16 mx-auto text-red-300" />
        </div>
        <h3 className="text-lg font-medium text-red-600 mb-2">Erreur de chargement</h3>
        <p className="text-sm text-gray-400">Impossible de charger les détails du ticket</p>
      </div>
    );
  }

  if (!ticket) return null;



  return (
    <div className="flex-1 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {/* Bouton retour - responsive */}
            {onBack && (
              <button
                onClick={onBack}
                title="Retour à la liste"
                className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            )}

            <div>
              <h1 className="text-base sm:text-xl md:text-2xl font-medium text-[#F17922] mb-1 break-words leading-tight">
                {ticket.order?.reference || 'Ticket sans commande'}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-500">
                Ticket #{ticket.code} - {ticket.category?.name}
              </p>
              <p className="text-xs text-gray-400">
                Client: {ticket.customer?.name || 'Client inconnu'}
              </p>
            </div>
          </div>

          {/* Partie droite - Badges statut + priorité (4 états cohérents) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold text-xs sm:text-sm border ${STATUS_BADGE[ticket.status]?.cls ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGE[ticket.status]?.dot ?? 'bg-gray-400'}`} />
              {STATUS_BADGE[ticket.status]?.label ?? ticket.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold text-xs sm:text-sm border ${PRIORITY_BADGE[ticket.priority]?.cls ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              {PRIORITY_BADGE[ticket.priority]?.label ?? ticket.priority}
            </span>
          </div>
        </div>

        {/* Controls - 3 dropdowns responsive */}
        <div className="flex items-start space-x-2 sm:items-center sm:space-x-4 md:space-x-8">
          {/* Statut */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
            <span className="text-xs sm:text-sm md:text-base text-gray-800 font-normal whitespace-nowrap">Statut:</span>
            <CustomDropdown
              options={statusOptions}
              value={selectedStatus}
              onChange={handleStatusChange}
              className="min-w-[60px] sm:min-w-[100px] md:min-w-[120px] text-xs sm:text-sm md:text-base"
            />
          </div>

          {/* Priorité */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
            <span className="text-xs sm:text-sm md:text-base text-gray-800 font-normal whitespace-nowrap">Priorité:</span>
            <CustomDropdown
              options={priorityOptions}
              value={selectedPriority}
              onChange={handlePriorityChange}
              className="min-w-[60px] sm:min-w-[100px] md:min-w-[120px] text-xs sm:text-sm md:text-base"
            />
          </div>

          {/* Assigné à */}
          {ticket.assignee && (
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
              <span className="text-xs sm:text-sm md:text-base text-gray-800 font-normal whitespace-nowrap">Assigné:</span>
              <span className="text-xs sm:text-sm md:text-base text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                {ticket.assignee.fullname || ticket.assignee.email || 'Agent'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto md:px-6 md:py-4 px-4 py-3">
          {/* Carte de contexte — remplit le haut de la conversation avec les
              infos clés du ticket (évite la sensation de panneau vide). */}
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-[#F17922]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Commande</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {ticket.order?.reference || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-blue-600" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Catégorie</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {ticket.category?.name || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-600" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Client</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {ticket.customer?.name || 'Client inconnu'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-500" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Créé le</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-green-600" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Assigné à</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {ticket.assignee?.fullname || ticket.assignee?.email || 'Non assigné'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Messages</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {sortedMessages.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:space-y-6 space-y-4">
            {sortedMessages && sortedMessages.length > 0 ? (
              sortedMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.authorUserId ? 'justify-end' : 'justify-start'}`}>
                  {msg.authorCustomerId ? (
                    /* Message client à gauche */
                    <div className="flex items-start md:space-x-3 space-x-2 md:max-w-2xl max-w-xs">
                      <div className="md:w-10 md:h-10 w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {ticket.customer?.image && ticket.customer.image.trim() !== '' && formatImageUrl(ticket.customer.image) ? (
                          <Image
                            src={formatImageUrl(ticket.customer.image)}
                            alt={ticket.customer.name}
                            width={40}
                            height={40}
                            className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                            onError={(e) => { 
                              (e.target as HTMLImageElement).style.display = 'none'; 
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="text-gray-600 font-medium text-sm">${ticket.customer?.first_name?.[0] || ticket.customer?.name?.[0] || 'C'}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="text-gray-600 font-medium text-sm">
                            {ticket.customer?.first_name?.[0] || ticket.customer?.name?.[0] || 'C'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center md:space-x-2 space-x-1 mb-1">
                          <span className="md:text-sm text-xs font-medium text-gray-900">{ticket.customer?.name}</span>
                          <span className="md:text-sm text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="bg-white text-gray-900 md:px-4 md:py-3 px-3 py-2 rounded-2xl">
                          <p className="md:text-sm text-xs leading-relaxed">{msg.body}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Message agent à droite */
                    <div className="flex items-start md:space-x-3 space-x-2 md:max-w-2xl max-w-xs">
                      <div className="flex-1">
                        <div className="flex items-center justify-end md:space-x-2 space-x-1 mb-1">
                          <span className="md:text-sm text-xs font-medium text-gray-500">{user?.fullname}</span> 
                          <span className="md:text-sm text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="bg-[#F17922] text-white md:px-4 md:py-3 px-3 py-2 rounded-2xl ml-auto max-w-fit">
                          <p className="md:text-sm text-xs leading-relaxed">{msg.body}</p>
                        </div>
                      </div>
                     <div className="md:w-10 md:h-10 w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {user?.image && user.image.trim() !== '' && formatImageUrl(user?.image) ? (
                          <Image
                           src={formatImageUrl(user?.image)}
                            alt={user?.fullname}
                            width={40}
                            height={40}
                            className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              // Fallback vers l'image par défaut en cas d'erreur
                              (e.target as HTMLImageElement).src = '/images/mascot.png';
                            }}
                          />
                        ) : (
                          <Image
                            src="/images/mascot.png"
                            alt={user?.fullname || 'Agent'}
                            width={40}
                            height={40}
                            className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <span className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-gray-300" />
                </span>
                <p className="text-gray-600 text-sm font-semibold">Aucun message pour le moment</p>
                <p className="text-gray-400 text-xs mt-1">Écrivez ci-dessous pour répondre au client.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone de saisie */}
      <div className="md:px-6 md:py-4 px-4 py-3 bg-white border-t border-slate-300">
        {/* Boutons Public/Interne */}
        <div className="flex md:mb-4 mb-3">
          <button
            onClick={() => setMessageType('public')}
            className={`flex items-center md:px-4 md:py-2 px-3 py-2 rounded-full md:text-sm text-xs font-medium md:mr-3 mr-2 cursor-pointer ${messageType === 'public'
              ? 'bg-[#F17922] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Eye className="md:w-4 md:h-4 w-3 h-3 md:mr-2 mr-1" />
            Public
          </button>
          <button
            onClick={() => setMessageType('internal')}
            className={`flex items-center md:px-4 md:py-2 px-3 py-2 rounded-full md:text-sm text-xs font-medium cursor-pointer ${messageType === 'internal'
              ? 'bg-[#F17922] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <EyeOff className="md:w-4 md:h-4 w-3 h-3 md:mr-2 mr-1" />
            Interne
          </button>
        </div>

        {/* Champ de saisie */}
        <div className="flex items-start md:space-x-3 space-x-2">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrire un message..."
              className="w-full md:px-4 md:py-3 px-3 py-2 border border-slate-400 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent md:text-sm text-xs bg-white"
              rows={3}
              onKeyDown={handleKeyPress}
            />
          </div>
          <button
            title="Envoyer le message"
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-[#F17922] text-white md:p-3 p-2 rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="md:w-5 md:h-5 w-4 h-4 animate-spin" />
            ) : (
              <Send className="md:w-5 md:h-5 w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TicketView;
