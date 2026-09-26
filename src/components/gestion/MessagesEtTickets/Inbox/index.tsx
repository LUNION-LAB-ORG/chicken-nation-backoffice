"use client";

import React, { useState, useEffect } from "react";
import InboxSidebar from "./InboxSidebar";
import ConversationView from "./ConversationView";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStore } from "@/store/dashboardStore";

function InboxModule({
  initialConversationId,
  initialMessageId,
}: {
  initialConversationId?: string | null;
  /** Message à atteindre dans cette conversation (mention, réponse). */
  initialMessageId?: string | null;
}) {
  const lastConversationId = useDashboardStore((s) => s.lastConversationId);
  const setLastConversation = useDashboardStore((s) => s.setLastConversation);
  // On reprend la conversation lue avant de partir sur un autre module.
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(initialConversationId || lastConversationId || null);
  /**
   * Message à atteindre, RATTACHÉ à sa conversation : tant que la bonne
   * conversation n'est pas affichée, la vue ne le reçoit pas. Sans ce lien, le
   * fil encore ouvert chercherait un message qui n'est pas chez lui.
   */
  const [messageCible, setMessageCible] = useState<{
    conversationId: string;
    messageId: string;
  } | null>(
    initialConversationId && initialMessageId
      ? { conversationId: initialConversationId, messageId: initialMessageId }
      : null
  );
  const queryClient = useQueryClient();
  const clearPendingConversation = useDashboardStore(
    (s) => s.clearPendingConversation
  );
  const clearPendingMessage = useDashboardStore((s) => s.clearPendingMessage);

  // Fonction pour sélectionner une conversation (le marquage comme lu se fait dans ConversationView)
  const handleSelectConversation = (conversationId: string | null) => {
    setSelectedConversation(conversationId);
    setLastConversation(conversationId);
    /**
     * L'agent part ailleurs avant que le message visé ait été atteint (retour
     * à la liste, autre conversation) : la cible est abandonnée. Gardée, elle
     * ressurgirait des heures plus tard en rouvrant cette conversation, et le
     * fil sauterait vers un vieux message sans qu'on l'ait demandé.
     */
    if (messageCible && messageCible.conversationId !== conversationId) {
      setMessageCible(null);
      clearPendingMessage();
    }
  };

  // Deep-link : quand une conversation est demandée (email / notification), on la
  // sélectionne puis on vide le store (sinon elle se rouvrirait à chaque retour).
  // Le message éventuel reste dans le store jusqu'à ce que la vue l'ait atteint.
  useEffect(() => {
    if (initialConversationId) {
      handleSelectConversation(initialConversationId);
      setMessageCible(
        initialMessageId
          ? { conversationId: initialConversationId, messageId: initialMessageId }
          : null
      );
      clearPendingConversation();
    }
    // `initialMessageId` est lu au moment où la conversation est demandée :
    // il arrive toujours avec elle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, queryClient, clearPendingConversation]);

  const messageCibleId =
    messageCible && messageCible.conversationId === selectedConversation
      ? messageCible.messageId
      : null;

  return (
    <div className="h-full bg-[#FBFBFB]">
      <div className="flex h-full">
        {/* Liste des conversations */}
        <div
          className={`
          ${selectedConversation ? "hidden lg:block" : "block"}
          lg:w-96 xl:w-[400px] 2xl:w-[450px] md:w-80 w-full bg-white border-r border-slate-300 h-full
        `}
        >
          <InboxSidebar
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Vue de la conversation */}
        <div
          className={`
          ${selectedConversation ? "block" : "hidden lg:block"}
          flex-1 bg-white h-full
        `}
        >
          <ConversationView
            conversationId={selectedConversation}
            onBack={() => handleSelectConversation(null)}
            messageCibleId={messageCibleId}
            onMessageCibleTraite={() => {
              setMessageCible(null);
              clearPendingMessage();
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default InboxModule;
