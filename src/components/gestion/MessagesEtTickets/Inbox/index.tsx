"use client";

import React, { useState, useEffect } from "react";
import InboxSidebar from "./InboxSidebar";
import ConversationView from "./ConversationView";
import { useQueryClient } from "@tanstack/react-query";

function InboxModule({
  initialConversationId,
}: {
  initialConversationId?: string | null;
}) {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(initialConversationId || null);
  const queryClient = useQueryClient();

  // Fonction pour sélectionner une conversation (le marquage comme lu se fait dans ConversationView)
  const handleSelectConversation = (conversationId: string | null) => {
    setSelectedConversation(conversationId);
  };

  // If initialConversationId changes (opened from header), select it
  useEffect(() => {
    if (initialConversationId) {
      handleSelectConversation(initialConversationId);
    }
  }, [initialConversationId, queryClient]);

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
          />
        </div>
      </div>
    </div>
  );
}

export default InboxModule;
