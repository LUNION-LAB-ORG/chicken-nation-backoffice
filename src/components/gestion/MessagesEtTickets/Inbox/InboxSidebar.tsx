"use client";

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createConversationWithDto, CreateConversationDto } from '@/services/messageService';
import ConversationsList from './ConversationsList';
import NewConversationModal from './NewConversationModal';

interface InboxSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string | null) => void;
}

function InboxSidebar({ selectedConversation, onSelectConversation }: InboxSidebarProps) {
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const handleCreateConversation = async (conversationData: { type: string; clientId?: string; restaurantId?: string; subject: string; initialMessage?: string; participantId?: string | null }) => {

    try {
      const dto: CreateConversationDto = {
        seed_message: conversationData.initialMessage || conversationData.subject || 'Nouvelle conversation',
        subject: conversationData.subject
      }

      if (conversationData.participantId) {
        dto.receiver_user_id = conversationData.participantId
      }

      if (conversationData.clientId) {
        dto.customer_to_contact_id = conversationData.clientId
      }

      if (conversationData.restaurantId) {
        dto.restaurant_id = conversationData.restaurantId
      }



      const created = await createConversationWithDto(dto)

      // Invalidate conversations and open the new conversation in the inbox
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      window.dispatchEvent(new CustomEvent('openInboxFromHeader', { detail: { conversationId: created.id } }))
    } catch (error) {
      console.error('Erreur création conversation:', error)
    } finally {
      setIsNewConversationModalOpen(false);
    }
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
