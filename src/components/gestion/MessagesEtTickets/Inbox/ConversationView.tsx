"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { MessageCircle, Send, ArrowLeft, AlertTriangle, ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatImageUrl } from '@/utils/imageHelpers';

interface ConversationViewProps {
  conversationId: string | null;
  onBack?: () => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

/** URL affichable d'une image de message (object URL local ou clé S3). */
const resolveMessageImage = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  return formatImageUrl(url);
};

const getMessageImage = (msg: IMessage): string | null => {
  const meta = msg.meta as { imageUrl?: string | null } | undefined;
  return resolveMessageImage(meta?.imageUrl);
};

/** Libellé du séparateur de jour (Aujourd'hui / Hier / date complète). */
const dayLabel = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isYesterday(date)) return 'Hier';
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  } catch {
    return '';
  }
};

const dayKey = (dateStr: string): string => {
  try {
    return new Date(dateStr).toDateString();
  } catch {
    return '';
  }
};

function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const [message, setMessage] = useState('');
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isMobileRightbarOpen, setIsMobileRightbarOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Fermer le lightbox avec Échap
  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxUrl]);

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

  // --- Pièce jointe image ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image trop volumineuse (max 5 Mo)');
      return;
    }
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingImage(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const clearPendingImage = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingImage(null);
    setPendingPreview(null);
  };

  const handleSendMessage = async () => {
    const body = message.trim();
    if ((!body && !pendingImage) || !conversationId || sendMessageMutation.isPending) return;

    const image = pendingImage;
    const previewUrl = pendingPreview;

    // Vider immédiatement (optimiste)
    setMessage('');
    setPendingImage(null);
    setPendingPreview(null);

    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        body,
        image: image ?? undefined,
        previewUrl: previewUrl ?? undefined,
      });
      // Le message serveur (URL S3) remplace l'optimiste → on libère l'aperçu local
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error("Échec de l'envoi du message");
      // Restaurer en cas d'erreur
      setMessage(body);
      if (image) {
        setPendingImage(image);
        setPendingPreview(previewUrl);
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

  const canSend = (message.trim().length > 0 || !!pendingImage) && !sendMessageMutation.isPending;

  return (
    <div className="h-full flex">
      {/* Zone principale de conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header de conversation */}
        <div className="md:px-6 md:py-3.5 px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center md:space-x-4 space-x-3 min-w-0">
            {/* Bouton retour - visible sur tous les écrans */}
            {onBack && (
              <button
                onClick={onBack}
                title="Retour à la liste"
                className="md:p-2 p-1 cursor-pointer hover:bg-orange-100 rounded-full shrink-0"
              >
                <ArrowLeft className="md:w-5 md:h-5 w-4 h-4 text-slate-600" />
              </button>
            )}

            {/* Info conversation - Cliquable sur mobile/tablette */}
            <div
              className="flex items-center md:space-x-4 space-x-3 xl:cursor-default cursor-pointer xl:pointer-events-none min-w-0"
              onClick={() => setIsMobileRightbarOpen(true)}
            >
              {/* Avatar */}
              <div className="relative md:w-11 md:h-11 w-10 h-10 shrink-0">
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
                      width={44}
                      height={44}
                      className="md:w-11 md:h-11 w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Informations conversation */}
              <div className="flex-1 min-w-0">
                <h3 className="md:text-base text-sm font-semibold text-gray-900 truncate">
                  {getConversationInfo.name}
                </h3>
                <div className="flex items-center md:space-x-2 space-x-1.5 mt-0.5 min-w-0">
                  {getConversationInfo.email && (
                    <span className="text-gray-500 text-xs truncate md:inline hidden">
                      {getConversationInfo.email}
                    </span>
                  )}
                  <span className="border-gray-200 border text-gray-600 px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap">
                    {currentConversation?.restaurant?.name || 'Chicken Nation'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setIsEscalateModalOpen(true)}
              className="bg-[#F17922] text-white md:px-4 md:py-2.5 px-3 py-2 rounded-xl md:text-sm text-xs font-medium flex items-center cursor-pointer hover:bg-orange-600 transition-all duration-200"
            >
              <AlertTriangle className="md:w-4 md:h-4 w-4 h-4 md:mr-2 mr-1.5" />
              <span className="lg:inline hidden">Escalader en ticket</span>
              <span className="lg:hidden">Escalader</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-[#FAFAFA] md:px-6 md:py-4 px-4 py-3">
          {/* Loading des messages */}
          {isLoadingMessages && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]"></div>
            </div>
          )}

          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}

          {/* Messages */}
          <div className="space-y-1.5">
            {conversationMessages.length === 0 && !isLoadingMessages ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun message dans cette conversation</p>
                <p className="text-sm mt-2">Envoyez le premier message pour commencer la discussion</p>
              </div>
            ) : (
              conversationMessages.map((msg, index) => {
                const prev = conversationMessages[index - 1];
                const isAgent = !!msg.authorUser;
                const newDay = !prev || dayKey(prev.createdAt) !== dayKey(msg.createdAt);
                // Regroupement : on n'affiche avatar + nom que quand l'auteur change (ou nouveau jour)
                const prevIsAgent = prev ? !!prev.authorUser : null;
                const sameAuthorAsPrev =
                  !!prev &&
                  !newDay &&
                  prevIsAgent === isAgent &&
                  (isAgent
                    ? prev?.authorUser?.id === msg.authorUser?.id
                    : prev?.authorCustomer?.id === msg.authorCustomer?.id);

                const imageUrl = getMessageImage(msg);
                const hasBody = !!msg.body && msg.body.trim().length > 0;
                const isTemp = String(msg.id).startsWith('temp-');

                const authorName = isAgent
                  ? (msg.authorUser?.name || 'Support')
                  : (msg.authorCustomer?.name ||
                      `${msg.authorCustomer?.first_name || ''} ${msg.authorCustomer?.last_name || ''}`.trim() ||
                      getConversationInfo.name);

                const avatarSrc = isAgent
                  ? (msg.authorUser?.image ? formatImageUrl(msg.authorUser.image) : '/icons/imageprofile.png')
                  : (msg.authorCustomer?.image
                      ? formatImageUrl(msg.authorCustomer.image)
                      : currentConversation?.customer?.image
                        ? formatImageUrl(currentConversation.customer.image)
                        : '/icons/imageprofile.png');

                return (
                  <React.Fragment key={msg.id}>
                    {/* Séparateur de jour */}
                    {newDay && (
                      <div className="flex items-center justify-center py-3">
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[11px] font-medium text-gray-500 capitalize shadow-sm">
                          {dayLabel(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'} ${sameAuthorAsPrev ? 'mt-0.5' : 'mt-3'}`}>
                      <div className={`flex items-end gap-2 md:max-w-[70%] max-w-[85%] ${isAgent ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar (uniquement sur le premier message du groupe) */}
                        <div className="w-8 h-8 shrink-0">
                          {!sameAuthorAsPrev && (
                            <Image
                              src={avatarSrc}
                              alt={authorName}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                        </div>

                        <div className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} min-w-0`}>
                          {/* Nom + heure (premier message du groupe) */}
                          {!sameAuthorAsPrev && (
                            <div className={`flex items-center gap-1.5 mb-1 px-1 ${isAgent ? 'flex-row-reverse' : ''}`}>
                              <span className="text-xs font-semibold text-gray-700">{authorName}</span>
                              <span className="text-[11px] text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                            </div>
                          )}

                          {/* Bulle */}
                          <div
                            className={`relative rounded-2xl overflow-hidden ${
                              isAgent
                                ? 'bg-[#F17922] text-white rounded-br-md'
                                : 'bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-md'
                            } ${isTemp ? 'opacity-70' : ''}`}
                          >
                            {/* Image jointe */}
                            {imageUrl && (
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(imageUrl)}
                                className={`block cursor-zoom-in ${hasBody ? '' : ''}`}
                                title="Agrandir l'image"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imageUrl}
                                  alt="Image jointe"
                                  className="max-w-[260px] md:max-w-[320px] max-h-[280px] object-cover block"
                                />
                              </button>
                            )}
                            {hasBody && (
                              <p className="md:text-sm text-xs leading-relaxed whitespace-pre-wrap break-words px-3.5 py-2.5">
                                {msg.body}
                              </p>
                            )}
                            {/* Heure pour les messages groupés (pas d'en-tête) */}
                            {sameAuthorAsPrev && !imageUrl && (
                              <span
                                className={`absolute bottom-1 ${isAgent ? 'left-1.5' : 'right-1.5'} text-[9px] ${
                                  isAgent ? 'text-white/60' : 'text-gray-300'
                                } opacity-0 group-hover:opacity-100`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Zone de saisie */}
        <div className="md:px-6 md:py-3.5 px-4 py-3 bg-white border-t border-slate-200">
          {/* Aperçu de l'image à envoyer */}
          {pendingPreview && (
            <div className="mb-2.5 inline-flex items-center gap-3 bg-orange-50/60 border border-orange-100 rounded-xl p-2 pr-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreview}
                alt="Aperçu"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
                  {pendingImage?.name || 'Image'}
                </p>
                <p className="text-[11px] text-gray-400">Sera envoyée avec votre message</p>
              </div>
              <button
                onClick={clearPendingImage}
                disabled={sendMessageMutation.isPending}
                className="p-1 hover:bg-orange-100 rounded-full transition-colors"
                title="Retirer l'image"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Champ de saisie */}
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent transition-shadow">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMessageMutation.isPending}
              className="p-2 rounded-full hover:bg-orange-100 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              title="Joindre une image"
            >
              <ImagePlus className="w-5 h-5 text-[#F17922]" />
            </button>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Écrire un message..."
              className="flex-1 max-h-32 px-1 py-2 text-slate-700 bg-transparent resize-none focus:outline-none md:text-sm text-xs"
              rows={2}
              disabled={sendMessageMutation.isPending}
            />
            <button
              title="Envoyer le message"
              onClick={handleSendMessage}
              disabled={!canSend}
              className="bg-[#F17922] text-white p-2.5 cursor-pointer rounded-full hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-colors"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
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

      {/* Visionneuse d'image plein écran */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Image"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default ConversationView;
