"use client";

import React, { useState } from 'react';
import { conversationAPI, useInvalidateConversationQuery } from '../../../../../features/messagerie';
import type { ICreerConversationDTO } from '../../../../../features/messagerie';
import ConversationsList from './ConversationsList';
import NewConversationModal from './NewConversationModal';

interface InboxSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string | null) => void;
}

function InboxSidebar({ selectedConversation, onSelectConversation }: InboxSidebarProps) {
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  const invalidateConversations = useInvalidateConversationQuery();

  const handleCreateConversation = async (conversationData: { type: string; clientId?: string; restaurantId?: string; subject: string; initialMessage?: string; participantId?: string | null }) => {
    try {
      const dto: ICreerConversationDTO = {
        seed_message: conversationData.initialMessage || conversationData.subject || 'Nouvelle conversation',
        subject: conversationData.subject,
      };

      if (conversationData.participantId) dto.receiver_user_id = conversationData.participantId;
      if (conversationData.clientId) dto.customer_to_contact_id = conversationData.clientId;
      if (conversationData.restaurantId) dto.restaurant_id = conversationData.restaurantId;

      const created = await conversationAPI.creer(dto);
      invalidateConversations();

      if (created?.id) {
        onSelectConversation(created.id);
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
    } finally {
      setIsNewConversationModalOpen(false);
    }
  };

  return (
    <div className="h-full bg-white border-r border-slate-300 overflow-y-auto">
      <ConversationsList
        selectedConversation={selectedConversation}
        onSelectConversation={onSelectConversation}
        onNewConversation={() => {
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
