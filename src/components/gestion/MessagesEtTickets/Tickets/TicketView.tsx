"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Ticket, ArrowLeft, Eye, EyeOff, Send, Loader2 } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { useTicketQuery, useSendTicketMessageMutation, useAssignTicketToCurrentUserMutation } from '@/hooks/useTicketsQuery';
import { useAuthStore } from '@/store/authStore';

interface TicketViewProps {
  ticketId: string | null;
  onBack?: () => void;
}

// Types pour les messages


// Les données des tickets sont maintenant récupérées via l'API

function TicketView({ ticketId, onBack }: TicketViewProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'public' | 'internal'>('public');

  // États pour les dropdowns
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Récupération des données du ticket via l'API
  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useTicketQuery(ticketId);

  // Récupération de l'utilisateur connecté
  const { user } = useAuthStore();

  // Mutations pour les messages et l'assignation
  const sendMessageMutation = useSendTicketMessageMutation();
  const assignTicketMutation = useAssignTicketToCurrentUserMutation();

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
      setSelectedAssignee(ticket.assignee?.id || '');
    }
  }, [ticket]);

  // Fonction pour envoyer un message
  const handleSendMessage = async () => {
    console.log('🚀 [handleSendMessage] Fonction appelée');
    console.log('📝 Message:', message);
    console.log('👤 User:', user);
    console.log('🎫 TicketId:', ticketId);

    if (!message.trim()) {
      console.log('❌ Message vide');
      return;
    }

    if (!user?.id || user.id.trim() === '') {
      console.log('❌ Utilisateur non connecté ou ID vide:', { user, userId: user?.id });
      return;
    }

    try {
      // Essayer d'assigner le ticket si nécessaire (mais continuer même si ça échoue)
      if (!ticket?.assignee || ticket.assignee.id !== user.id) {
        console.log('🎯 Tentative d\'attribution du ticket...');
        console.log('📋 État actuel du ticket:');
        console.log('  - Ticket ID:', ticketId);
        console.log('  - Assignee actuel:', ticket?.assignee);
        console.log('  - User connecté:', { id: user.id, email: user.email, role: user.role });
        console.log('  - Condition assignation:', !ticket?.assignee ? 'Pas d\'assignee' : `Assignee différent (${ticket.assignee.id} vs ${user.id})`);

        try {
          console.log('🚀 Appel de l\'API d\'assignation...');
          console.log('🔍 Données d\'assignation:', { ticketId, assigneeId: user.id, userObject: user });
          
          if (!user.id) {
            console.error('❌ user.id est undefined ou vide:', user.id);
            throw new Error('ID utilisateur manquant');
          }
          
          await assignTicketMutation.mutateAsync({ ticketId, assigneeId: user.id });
          console.log('✅ Ticket assigné avec succès');
        } catch (assignError) {
          console.warn('⚠️ Échec de l\'assignation, mais on continue avec l\'envoi du message:');
          console.warn('  - Erreur:', assignError);
          console.warn('  - Message d\'erreur:', assignError?.message);
          console.warn('  - Status:', assignError?.status);
        }
      } else {
        console.log('✅ Ticket déjà assigné à l\'utilisateur actuel, pas besoin d\'assignation');
      }

      console.log('📤 Envoi du message...');
      // Envoyer le message
      const messagePayload = {
        ticketId,
        messageData: {
          body: message,
          internal: messageType === 'internal',
          authorId: user.id,
          meta: 'dashboard'
        }
      };
      console.log('📦 Payload du message:', messagePayload);

      await sendMessageMutation.mutateAsync(messagePayload);
      console.log('✅ Message envoyé avec succès');

      // Réinitialiser le champ de message
      setMessage('');
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
    }
  };

  // Fonction pour gérer l'envoi avec Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Options pour les dropdowns
  const statusOptions = [
    { value: 'Ouvert', label: 'Ouvert' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Résolu', label: 'Résolu' }
  ];

  const priorityOptions = [
    { value: 'Urgent', label: 'Urgent' },
    { value: 'Élevé', label: 'Élevé' },
    { value: 'Moyen', label: 'Moyen' },
    { value: 'Faible', label: 'Faible' }
  ];

  const assigneeOptions = [
    { value: 'Marie Dubois', label: 'Marie Dubois' },
    { value: 'Ahmed', label: 'Ahmed' },
    { value: 'Sophie Martin', label: 'Sophie Martin' },
    { value: 'Lucas Bernard', label: 'Lucas Bernard' }
  ];

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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
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
    <div className="flex-1 bg-white flex flex-col">
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
              <h1 className="text-base sm:text-xl md:text-2xl font-medium text-orange-500 mb-1 break-words leading-tight">
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

          {/* Partie droite - Badges colorés responsive */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            <span className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-2 rounded-full text-white font-medium text-xs sm:text-sm md:text-base ${ticket.status === 'OPEN' ? 'bg-red-500' :
              ticket.status === 'IN_PROGRESS' ? 'bg-orange-500' :
                'bg-green-500'
              }`}>
              {ticket.status === 'OPEN' ? 'Ouvert' :
                ticket.status === 'IN_PROGRESS' ? 'En cours' :
                  ticket.status === 'RESOLVED' ? 'Résolu' :
                    ticket.status}
            </span>
            <span className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-2 rounded-full text-white font-medium text-xs sm:text-sm md:text-base ${ticket.priority === 'URGENT' ? 'bg-red-500' :
              ticket.priority === 'HIGH' ? 'bg-orange-500' :
                ticket.priority === 'MEDIUM' ? 'bg-yellow-500' :
                  'bg-green-500'
              }`}>
              {ticket.priority === 'URGENT' ? 'Urgent' :
                ticket.priority === 'HIGH' ? 'Élevé' :
                  ticket.priority === 'MEDIUM' ? 'Moyen' :
                    ticket.priority === 'LOW' ? 'Faible' :
                      ticket.priority}
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
              onChange={setSelectedStatus}
              className="min-w-[60px] sm:min-w-[100px] md:min-w-[120px] text-xs sm:text-sm md:text-base"
            />
          </div>

          {/* Priorité */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
            <span className="text-xs sm:text-sm md:text-base text-gray-800 font-normal whitespace-nowrap">Priorité:</span>
            <CustomDropdown
              options={priorityOptions}
              value={selectedPriority}
              onChange={setSelectedPriority}
              className="min-w-[60px] sm:min-w-[100px] md:min-w-[120px] text-xs sm:text-sm md:text-base"
            />
          </div>

          {/* Assigné à */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
            <span className="text-xs sm:text-sm md:text-base text-gray-800 font-normal whitespace-nowrap">Assigné:</span>
            <CustomDropdown
              options={assigneeOptions}
              value={selectedAssignee}
              onChange={setSelectedAssignee}
              className="min-w-[70px] sm:min-w-[130px] md:min-w-[150px] text-xs sm:text-sm md:text-base"
            />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-gray-50">
        {/* Boutons Public/Interne */}
        <div className="m-4">
          <div className="bg-slate-100 p-2 rounded-2xl">
            {/* Version mobile - compacte */}
            <div className="flex sm:hidden gap-2">
              <button
                onClick={() => setMessageType('public')}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-xl transition-colors ${messageType === 'public'
                  ? 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                <Eye className="w-3 h-3 mr-1" />
                Public
              </button>
              <button
                onClick={() => setMessageType('internal')}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-xl transition-colors ${messageType === 'internal'
                  ? 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Interne
              </button>
            </div>

            {/* Version tablette/desktop - normale */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setMessageType('public')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-2xl transition-colors ${messageType === 'public'
                  ? 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Public (client voit)
              </button>
              <button
                onClick={() => setMessageType('internal')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-2xl transition-colors ${messageType === 'internal'
                  ? 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Interne (client ne voit pas)
              </button>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50 md:px-6 md:py-4 px-4 py-3">
          <div className="md:space-y-6 space-y-4">
            {sortedMessages && sortedMessages.length > 0 ? (
              sortedMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.authorUserId ? 'justify-end' : 'justify-start'}`}>
                  {msg.authorCustomerId ? (
                    /* Message client à gauche */
                    <div className="flex items-start md:space-x-3 space-x-2 md:max-w-2xl max-w-xs">
                      <div className="md:w-10 md:h-10 w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {ticket.customer?.image && ticket.customer.image.trim() !== '' ? (
                          <Image
                            src={`https://chicken.turbodeliveryapp.com/${ticket.customer.image}`}
                            alt={ticket.customer.name}
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
                          <span className="md:text-sm text-xs font-medium text-gray-500">Agent</span>
                          <span className="md:text-sm text-xs text-gray-500">support</span>
                          <span className="md:text-sm text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="bg-orange-500 text-white md:px-4 md:py-3 px-3 py-2 rounded-2xl ml-auto max-w-fit">
                          <p className="md:text-sm text-xs leading-relaxed">{msg.body}</p>
                        </div>
                      </div>
                      <div className="md:w-10 md:h-10 w-8 h-8 rounded-full flex-shrink-0 bg-orange-200 flex items-center justify-center">
                        <span className="text-orange-700 font-medium text-sm">A</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Aucun message pour ce ticket</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone de saisie - Copiée exactement de ConversationView */}
      <div className="md:px-6 md:py-4 px-4 py-3 bg-white border-t border-slate-300">
        {/* Boutons Public/Interne */}
        <div className="flex md:mb-4 mb-3">
          <button
            onClick={() => setMessageType('public')}
            className={`flex items-center md:px-4 md:py-2 px-3 py-2 rounded-full md:text-sm text-xs font-medium md:mr-3 mr-2 ${messageType === 'public'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Eye className="md:w-4 md:h-4 w-3 h-3 md:mr-2 mr-1" />
            Public
          </button>
          <button
            onClick={() => setMessageType('internal')}
            className={`flex items-center md:px-4 md:py-2 px-3 py-2 rounded-full md:text-sm text-xs font-medium ${messageType === 'internal'
              ? 'bg-orange-500 text-white'
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
              placeholder={messageType === 'public' ? "Écrire un message public..." : "Écrire un message interne..."}
              className="w-full md:px-4 md:py-3 px-3 py-2 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent md:text-sm text-xs bg-gray-50"
              rows={3}
              onKeyDown={handleKeyPress}
            />
          </div>
          <button
            title="Envoyer le message"
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-orange-500 text-white md:p-3 p-2 rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
