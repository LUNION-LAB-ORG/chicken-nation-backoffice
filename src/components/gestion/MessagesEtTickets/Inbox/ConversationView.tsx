"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { MessageCircle, Eye, EyeOff, Send, ArrowLeft, AlertTriangle } from 'lucide-react';
import InboxRightbar from './InboxRightbar';
import MobileRightSidebar from './MobileRightSidebar';
import EscalateTicketModal from './EscalateTicketModal';
import { useMessagesQuery, useSendMessageMutation } from '@/hooks/useConversationsQuery';
import { useMessagesSocket } from '@/hooks/useMessagesSocket';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatImageUrl } from '@/utils/imageHelpers';
import type { MessagesResponse, Message } from '@/types/messaging';

interface ConversationViewProps {
  conversationId: string | null;
  onBack?: () => void;
}

function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'public' | 'internal'>('public');
  const [isMobileRightbarOpen, setIsMobileRightbarOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 🔌 React Query hooks
  const { 
    data: messagesPagesData, 
    isLoading: isLoadingMessages, 
    refetch: refetchMessagesQuery,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMessagesQuery(conversationId);
  
  const sendMessageMutation = useSendMessageMutation();
  // const markAsReadMutation = useMarkAsReadMutation(); // Temporairement désactivé

  // Flatten pages and sort chronologically (older -> newer)
  const conversationMessages = useMemo(() => {
    const pages = (messagesPagesData?.pages || []) as MessagesResponse[];
    const all = pages.flatMap((p) => p.data || []) as Message[];
    return all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagesPagesData]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);
  
  // Récupérer la conversation actuelle (on peut obtenir des infos depuis le premier message)
  const currentConversation = useMemo(() => {
    if (!conversationMessages.length) return null;
    
    // Obtenir les infos depuis le premier message
    const firstMessage = conversationMessages[0];
    if (firstMessage?.authorCustomer) {
      return {
        id: conversationId!,
        client_id: firstMessage.authorCustomer.id,
        client: {
          fullname: firstMessage.authorCustomer.name || 
                   `${firstMessage.authorCustomer.first_name || ''} ${firstMessage.authorCustomer.last_name || ''}`.trim(),
          image: firstMessage.authorCustomer.image,
          email: ((firstMessage.authorCustomer as unknown) as { email?: string })?.email ?? null
        }
      };
    }
    return null;
  }, [conversationMessages, conversationId]);

  // Fonction utilitaire pour obtenir les informations client depuis les messages
  const getClientInfo = useMemo(() => {
    if (!conversationMessages || conversationMessages.length === 0) {
      return {
        name: currentConversation?.client?.fullname || 'Nom non disponible',
        image: currentConversation?.client?.image || null,
        email: currentConversation?.client?.email || null
      };
    }

    // Chercher le premier message avec des données client complètes
    const clientMessage = conversationMessages.find(msg => msg.authorCustomer);
    if (clientMessage?.authorCustomer) {
      const client = clientMessage.authorCustomer;
      return {
        name: client.name || 
              `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
              currentConversation?.client?.fullname ||
              'Client',
  image: client.image || currentConversation?.client?.image || null,
  email: ((client as unknown) as { email?: string })?.email || currentConversation?.client?.email || null
      };
    }

    // Fallback sur les données de conversation
    return {
      name: currentConversation?.client?.fullname || 'Nom non disponible',
      image: currentConversation?.client?.image || null,
      email: currentConversation?.client?.email || null
    };
  }, [conversationMessages, currentConversation]);

  // 🔌 Hook WebSocket pour les mises à jour en temps réel
  const { socketConnected, refetchMessages } = useMessagesSocket({
    conversationId,
    enabled: !!conversationId,
  });

  // Marquer comme lu quand la conversation change - DÉSACTIVÉ temporairement pour éviter la boucle
  // useEffect(() => {
  //   if (conversationId) {
  //     markAsReadMutation.mutate(conversationId);
  //   }
  // }, [conversationId]); // Suppression de markAsReadMutation des dépendances

  // 📜 Scroll automatique vers le bas - avec gestion intelligente
  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Charger plus d'anciens messages quand on scroll vers le haut
  const handleScroll = useCallback(async () => {
    const el = scrollContainerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    // si on est proche du top (ex: scrollTop < 100px)
    if (el.scrollTop < 120) {
      // Préserver la position actuelle
      const previousHeight = el.scrollHeight;
  await fetchNextPage();
      // Après chargement, recalculer et restaurer le scrollTop pour préserver la vue actuelle
      requestAnimationFrame(() => {
        try {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - previousHeight + el.scrollTop;
        } catch (err) {
          console.warn('Erreur en restaurant la position de scroll', err);
        }
      });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Scroll au changement de conversation (instant)
  useEffect(() => {
    if (conversationId && conversationMessages.length > 0) {
      // Sur la première ouverture de conversation on scroll en bas
      if (isInitialLoadRef.current) {
        scrollToBottom('instant');
        isInitialLoadRef.current = false;
      }

      // Marquer localement les messages comme lus quand on ouvre la conversation
      // Mise à jour locale via React Query
      if (conversationId) {
        // Messages: set isRead = true safely
        queryClient.setQueryData<MessagesResponse>(['messages', conversationId], (oldData) => {
          const prev = oldData ?? { data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } };
          const data = Array.isArray(prev.data) ? prev.data.map((m) => ({ ...m, isRead: true })) : [];
          return { ...prev, data };
        });

        // Conversations: safely update unread_count for the opened conversation
        queryClient.setQueryData<import('@/types/messaging').ConversationsResponse>(['conversations'], (old) => {
          const prev = (old as import('@/types/messaging').ConversationsResponse) || { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
          const dataArray = Array.isArray(prev.data) ? prev.data : [];
          const updated = dataArray.map((conv) => (conv && conv.id === conversationId ? { ...conv, unread_count: 0 } : conv));
          return { ...prev, data: updated } as import('@/types/messaging').ConversationsResponse;
        });
      }
    }
  }, [conversationId, conversationMessages.length, queryClient]);

  // Scroll quand de nouveaux messages arrivent (smooth)
  useEffect(() => {
    if (conversationMessages.length > 0) {
      const timer = setTimeout(() => {
        // Quand de nouveaux messages arrivent (non paginés), scroll en bas
        if (!isFetchingNextPage) scrollToBottom('smooth');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [conversationMessages.length, isFetchingNextPage]); // On écoute le changement de longueur

  if (!conversationId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="mb-4">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Sélectionnez une conversation</h3>
        <p className="text-sm text-gray-400">Choisissez une conversation dans la liste pour voir les messages</p>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (message.trim() && conversationId && !sendMessageMutation.isPending) {
      try {
        await sendMessageMutation.mutateAsync({
          conversationId,
          content: message.trim(),
          messageType: 'TEXT'
        });
        setMessage('');
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm', { locale: fr });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="h-full flex">
      {/* Zone principale de conversation */}
      <div className="flex-1 flex flex-col">
        {/* Header de conversation */}
        <div className="md:px-6 md:py-4 px-4 py-3 bg-white border-b border-slate-300 flex items-center justify-between">
          <div className="flex items-center md:space-x-4 space-x-3">
            {/* Bouton retour - visible sur tous les écrans */}
            {onBack && (
              <button 
                onClick={onBack}
                title="Retour à la liste"
                className="md:p-2 p-1 hover:bg-orange-100 rounded-full"
              >
                <ArrowLeft className="md:w-5 md:h-5 w-4 h-4 text-slate-600" />
              </button>
            )}
            
            {/* Info conversation - Cliquable sur mobile/tablette */}
            <div 
              className="flex items-center space-x-4 xl:cursor-default cursor-pointer xl:pointer-events-none"
              onClick={() => setIsMobileRightbarOpen(true)}
            >
              {/* Avatar unique */}
              <div className="md:w-12 md:h-12 w-10 h-10 rounded-full">
                <Image
                  src={getClientInfo.image ? formatImageUrl(getClientInfo.image) : "/icons/imageprofile.png"}
                  alt={getClientInfo.name}
                  width={48}
                  height={48}
                  className="md:w-12 md:h-12 w-10 h-10 rounded-full object-cover"
                />
              </div>
              
              {/* Informations client et restaurant */}
              <div className="flex-1">
                <h3 className="md:text-lg text-base font-medium text-orange-500 mb-1">
                  {getClientInfo.name}
                </h3>
                <div className="flex items-center md:space-x-3 space-x-2">
                  {getClientInfo.email && (
                    <span className="text-gray-600 md:text-sm text-xs">
                      {getClientInfo.email}
                    </span>
                  )}
                  <span className="border-gray-200 border text-gray-700 md:px-3 md:py-1 px-2 py-0.5 rounded-full md:text-sm text-xs">
                    Chicken Nation
                  </span>
                  <span className="text-gray-500 md:text-sm text-xs md:inline hidden">
                    • 1 Participant
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
           
            {/* Bouton d'escalation en ticket - Temporairement désactivé */}
            {/* 
            <button 
              onClick={() => setIsEscalateModalOpen(true)}
              className="bg-orange-500 text-white md:px-6 md:py-4 px-3 py-2 rounded-2xl md:text-sm text-xs font-medium flex items-center cursor-pointer hover:bg-orange-600 transition-all duration-200"
            >
              <AlertTriangle className="md:w-5 md:h-5 w-4 h-4 md:mr-3 mr-2" />
              <span className="md:inline hidden lg:inline">Escalader en ticket</span>
              <span className="md:hidden">Escalader</span>
            </button>
            */}
          </div>
        </div>

        {/* Messages */}
  <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-gray-50 md:px-6 md:py-4 px-4 py-3">
          {/* Loading des messages */}
          {isLoadingMessages && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Messages sans erreur - React Query gère les erreurs automatiquement */}
          {!isLoadingMessages && conversationMessages.length === 0 && (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">Aucun message dans cette conversation</p>
            </div>
          )}

          {/* Messages */}
          <div className="md:space-y-6 space-y-4">
            {conversationMessages.length === 0 && !isLoadingMessages ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun message dans cette conversation</p>
                <p className="text-sm mt-2">Envoyez le premier message pour commencer la discussion</p>
              </div>
            ) : (
              conversationMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.authorUser ? 'justify-end' : 'justify-start'}`}>
                  {msg.authorCustomer ? (
                    /* Message client à gauche */
                    <div className="flex items-start md:space-x-3 space-x-2 md:max-w-2xl max-w-xs">
                      <div className="md:w-10 md:h-10 w-8 h-8 rounded-full flex-shrink-0">
                        <Image
                          src={
                            msg.authorCustomer?.image ? formatImageUrl(msg.authorCustomer.image) :
                            currentConversation?.client?.image ? formatImageUrl(currentConversation.client.image) :
                            "/icons/imageprofile.png"
                          }
                          alt={msg.authorCustomer?.name || msg.authorCustomer?.first_name || 'Client'}
                          width={40}
                          height={40}
                          className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center md:space-x-2 space-x-1 mb-1">
                          <span className="md:text-sm text-xs font-medium text-gray-900">
                            {msg.authorCustomer?.name || 
                             `${msg.authorCustomer?.first_name || ''} ${msg.authorCustomer?.last_name || ''}`.trim() ||
                             currentConversation?.client?.fullname || 'Client'}
                          </span>
                          <span className="md:text-sm text-xs text-gray-400">
                            {formatMessageTime(msg.createdAt)}
                          </span>
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
                          <span className="md:text-sm text-xs text-gray-400">
                            {formatMessageTime(msg.createdAt)}
                          </span> 
                          <span className="md:text-sm text-xs font-medium text-gray-500">
                            {msg.authorUser?.name || 
                             msg.authorUser?.name ||
                             'Support'}
                          </span>
                        </div>
                        <div className="bg-orange-500 text-white md:px-4 md:py-3 px-3 py-2 rounded-2xl ml-auto max-w-fit">
                          <p className="md:text-sm text-xs leading-relaxed">{msg.body}</p>
                        </div>
                      </div>
                      <div className="md:w-10 md:h-10 w-8 h-8 rounded-full flex-shrink-0">
                        <Image
                          src={formatImageUrl(msg.authorUser?.image) || "/icons/imageprofile.png"}
                          alt={msg.authorUser?.name || msg.authorUser?.email || 'Agent'}
                          width={40}
                          height={40}
                          className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Zone de saisie */}
        <div className="md:px-6 md:py-4 px-4 py-3 bg-white border-t border-slate-300">
          {/* Boutons Public/Interne */}
          <div className="flex md:mb-4 mb-3">
            <button
              onClick={() => setMessageType('public')}
              className={`flex items-center md:px-4 md:py-2 px-3 py-2 rounded-full md:text-sm text-xs font-medium md:mr-3 mr-2 ${
                messageType === 'public'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Eye className="md:w-4 md:h-4 w-3 h-3 md:mr-2 mr-1" />
              Public
            </button>
            <button
              onClick={() => setMessageType('internal')}
              className={`flex items-center md:px-4 md:py-2 px-3 py-2 rounded-full md:text-sm text-xs font-medium ${
                messageType === 'internal'
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
                onKeyPress={handleKeyPress}
                placeholder={messageType === 'public' ? "Écrire un message public..." : "Écrire un message interne..."}
                className="w-full md:px-4 md:py-3 px-3 py-2 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent md:text-sm text-xs bg-gray-50"
                rows={3}
                disabled={sendMessageMutation.isPending}
              />
            </div>
            <button
              title="Envoyer le message"
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-orange-500 text-white md:p-3 p-2 rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 relative"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin rounded-full md:w-5 md:h-5 w-4 h-4 border-b-2 border-white"></div>
              ) : (
                <Send className="md:w-5 md:h-5 w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar droite avec informations client */}
      <div className="hidden xl:block">
        <InboxRightbar 
          conversationId={conversationId}
          clientName={getClientInfo.name}
          clientEmail={getClientInfo.email}
          clientImage={getClientInfo.image}
          clientPhone=""
        />
      </div>

      {/* Sidebar mobile qui s'ouvre par la droite */}
      <MobileRightSidebar 
        isOpen={isMobileRightbarOpen}
        onClose={() => setIsMobileRightbarOpen(false)}
        conversationId={conversationId}
        clientName={getClientInfo.name}
        clientEmail={getClientInfo.email}
        clientImage={getClientInfo.image}
        clientPhone=""
      />

      {/* Modal d'escalation */}
      <EscalateTicketModal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        conversationId={conversationId}
        clientName={getClientInfo.name}
      />
    </div>
  );
}

export default ConversationView;
