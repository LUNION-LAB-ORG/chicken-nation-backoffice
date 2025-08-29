"use client";

import React, { useState } from 'react';
import ConversationsList from './ConversationsList';
import NewConversationModal from './NewConversationModal';

interface InboxSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string | null) => void;
}

function InboxSidebar({ selectedConversation, onSelectConversation }: InboxSidebarProps) {
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  const handleCreateConversation = (conversationData: { type: string; client?: string; restaurant?: string; subject: string; initialMessage?: string; participantSearch?: string }) => {
    console.log('Nouvelle conversation:', conversationData);
    // Ici vous pourriez appeler une API pour créer la conversation
    setIsNewConversationModalOpen(false);
  };

  return (
    <div className="lg:w-96 xl:w-[450px] 2xl:w-[500px] bg-white border-r border-slate-300">
      <ConversationsList 
        selectedConversation={selectedConversation}
        onSelectConversation={onSelectConversation}
        onNewConversation={() => {
          console.log('Ouverture du modal');
          setIsNewConversationModalOpen(true);
        }}
      />
      
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onCreateConversation={handleCreateConversation}
      />
    </div>
  );
}

export default InboxSidebar;
