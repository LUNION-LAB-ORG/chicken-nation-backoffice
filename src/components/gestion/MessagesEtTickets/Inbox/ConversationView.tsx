"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { MessageCircle, Send, ArrowLeft, AlertTriangle } from 'lucide-react';
import InboxRightbar from './InboxRightbar';
import MobileRightSidebar from './MobileRightSidebar';
import EscalateTicketModal from './EscalateTicketModal';
import {
  useMessageListQuery,
  useEnvoyerMessageMutation,
  useMarquerLuMutation,
  useMessagerieSocketSync,
} from '../../../../../features/messagerie';
import type { IMessage } from '../../../../../features/messagerie';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatImageUrl } from '@/utils/imageHelpers';

interface ConversationViewProps {
  conversationId: string | null;
  onBack?: () => void;
}

function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const [message, setMessage] = useState('');
  const [isMobileRightbarOpen, setIsMobileRightbarOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 🔌 React Query hooks
  const {
    data: messagesPagesData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMessageListQuery(conversationId);

  const sendMessageMutation = useEnvoyerMessageMutation();
  const marquerLuMutation = useMarquerLuMutation();

  // Flatten pages and sort chronologically (older -> newer)
  const conversationMessages = useMemo(() => {
    const pages = (messagesPagesData?.pages || []) as any[];
    const all = pages.flatMap((p) => p.data || []) as IMessage[];
    return all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagesPagesData]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);

  // Récupérer la conversation actuelle depuis la liste des conversations
  const currentConversation = useMemo(() => {
    if (!conversationId) return null;

    // Récupérer la conversation depuis le cache React Query (clé = ['conversation', 'list'])
    const conversationsData = queryClient.getQueryData(['conversation', 'list']) as any;
    const conversations = conversationsData?.data || [];
    const conversation = conversations.find((c: any) => c.id === conversationId);

    return conversation || null;
  }, [conversationId, queryClient, conversationMessages]);

  // Fonction utilitaire pour obtenir les informations d'affichage de la conversation
  const getConversationInfo = useMemo(() => {
    if (!currentConversation) {
      return {
        name: 'Conversation non trouvée',
        image: null,
        email: null,
        isInternal: false,
        participantCount: 1
      };
    }

    const isInternal = !currentConversation.customer;
    
    if (isInternal) {
      // Conversation interne
      const participantNames = currentConversation.users?.map((user: any) => user.fullName).join(', ') || 'Discussion interne';
      const participantCount = Math.max(1, currentConversation.users?.length || 1);
      
      return {
        name: participantNames,
        image: currentConversation.users?.[0]?.image || null,
        email: null,
        isInternal: true,
        participantCount
      };
    } else {
      // Conversation avec client
      const customer = currentConversation.customer;
      return {
        name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Client' : 'Client inconnu',
        image: customer?.image || null,
        email: customer?.email || null,
        isInternal: false,
        participantCount: 1
      };
    }
  }, [currentConversation]);

  // 🔌 Hook WebSocket pour les mises à jour en temps réel
  useMessagerieSocketSync({ conversationId, enabled: !!conversationId });

  // Marquer comme lu via l'API serveur quand la conversation change
  useEffect(() => {
    if (conversationId) {
      marquerLuMutation.mutate(conversationId);
    }
  }, [conversationId]);

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
    }
  }, [conversationId, conversationMessages.length]);

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
      const body = message.trim();
      setMessage(''); // Vider immédiatement (optimiste)
      try {
        await sendMessageMutation.mutateAsync({ conversationId, body });
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        setMessage(body); // Restaurer en cas d'erreur
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
                className="md:p-2 p-1 cursor-pointer hover:bg-orange-100 rounded-full"
              >
                <ArrowLeft className="md:w-5 md:h-5 w-4 h-4 text-slate-600" />
              </button>
            )}

            {/* Info conversation - Cliquable sur mobile/tablette */}
            <div
              className="flex items-center space-x-4 xl:cursor-default cursor-pointer xl:pointer-events-none"
              onClick={() => setIsMobileRightbarOpen(true)}
            >
              {/* Avatar */}
              <div className="relative md:w-12 md:h-12 w-10 h-10">
                {getConversationInfo.isInternal ? (
                  // Affichage pour conversation interne - deux avatars côte à côte
                  <div className="relative w-full h-full">
                    {currentConversation?.users?.slice(0, 2).map((user: any, index: number) => {
                       const size = index === 0 ? 'md:w-8 md:h-8 w-7 h-7' : 'md:w-7 md:h-7 w-6 h-6';
                       const position = index === 0 ? 'absolute top-0 left-0' : 'absolute bottom-5 right-0';
                      
                      return (
                        <div key={user.id} className={`${size} ${position}`}>
                          <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border-2 border-white overflow-hidden">
                            {user.image ? (
                              <Image
                                src={formatImageUrl(user.image)}
                                alt={user.fullName}
                                width={32}
                                height={32}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="md:text-xs text-xs font-bold text-gray-600 uppercase">
                                {user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Affichage pour conversation avec client
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border-2 border-white overflow-hidden">
                    <Image
                      src={getConversationInfo.image ? formatImageUrl(getConversationInfo.image) : "/icons/imageprofile.png"}
                      alt={getConversationInfo.name}
                      width={48}
                      height={48}
                      className="md:w-12 md:h-12 w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Informations conversation */}
              <div className="flex-1">
                <h3 className="md:text-lg text-base font-medium text-[#F17922] mb-1">
                  {getConversationInfo.name}
                </h3>
                <div className="flex items-center md:space-x-3 space-x-2">
                  {getConversationInfo.email && (
                    <span className="text-gray-600 md:text-sm text-xs">
                      {getConversationInfo.email}
                    </span>
                  )}
                  <span className="border-gray-200 border text-gray-700 md:px-3 md:py-1 px-2 py-0.5 rounded-full md:text-sm text-xs">
                    {currentConversation?.restaurant?.name || 'Chicken Nation'}
                  </span>
                  <span className="text-gray-500 md:text-sm text-xs md:inline hidden">
                    • {getConversationInfo.participantCount} Participant{getConversationInfo.participantCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">

            <button
              onClick={() => setIsEscalateModalOpen(true)}
              className="bg-[#F17922] text-white md:px-6 md:py-4 px-3 py-2 rounded-2xl md:text-sm text-xs font-medium flex items-center cursor-pointer hover:bg-orange-600 transition-all duration-200"
            >
              <AlertTriangle className="md:w-5 md:h-5 w-4 h-4 md:mr-3 mr-2" />
              <span className="md:inline hidden lg:inline">Escalader en ticket</span>
              <span className="md:hidden">Escalader</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-gray-50 md:px-6 md:py-4 px-4 py-3">
          {/* Loading des messages */}
          {isLoadingMessages && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]"></div>
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
                              currentConversation?.customer?.image ? formatImageUrl(currentConversation.customer.image) :
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
                              currentConversation?.customer ? `${currentConversation.customer.first_name || ''} ${currentConversation.customer.last_name || ''}`.trim() : 'Client'}
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
                        <div className="bg-[#F17922] text-white md:px-4 md:py-3 px-3 py-2 rounded-2xl ml-auto max-w-fit">
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
          {/* Champ de saisie */}
          <div className="flex items-start md:space-x-3 space-x-2">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Écrire un message..."
                className="w-full md:px-4 md:py-3 text-slate-700 px-3 py-2 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent md:text-sm text-xs bg-gray-50"
                rows={3}
                disabled={sendMessageMutation.isPending}
              />
            </div>
            <button
              title="Envoyer le message"
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-[#F17922] text-white md:p-3 p-2 cursor-pointer rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 relative"
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

      {/* Sidebar droite avec informations */}
      <div className="hidden xl:block">
        <InboxRightbar
          conversationId={conversationId}
          clientName={getConversationInfo.name}
          clientEmail={getConversationInfo.email}
          clientImage={getConversationInfo.image}
          clientPhone={getConversationInfo.isInternal ? "" : currentConversation?.customer?.phone || ""}
          isInternal={getConversationInfo.isInternal}
          participants={currentConversation?.users || []}
        />
      </div>

      {/* Sidebar mobile qui s'ouvre par la droite */}
      <MobileRightSidebar
        isOpen={isMobileRightbarOpen}
        onClose={() => setIsMobileRightbarOpen(false)}
        conversationId={conversationId}
        clientName={getConversationInfo.name}
        clientEmail={getConversationInfo.email}
        clientImage={getConversationInfo.image}
        clientPhone={getConversationInfo.isInternal ? "" : currentConversation?.customer?.phone || ""}
        isInternal={getConversationInfo.isInternal}
        participants={currentConversation?.users || []}
      />

      {/* Modal d'escalation */}
      <EscalateTicketModal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        conversationId={conversationId}
        clientName={getConversationInfo.name}
      />
    </div>
  );
}

export default ConversationView;
