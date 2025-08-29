"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Users } from 'lucide-react';
import { useConversationsQuery } from '@/hooks/useConversationsQuery';
import { useConversationsSocket } from '@/hooks/useConversationsSocket';
import { formatImageUrl } from '@/utils/imageHelpers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Conversation } from '@/types/messaging';

interface ConversationsListProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation?: () => void;
}

function ConversationsList({ selectedConversation, onSelectConversation, onNewConversation }: ConversationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔌 React Query hooks
  const { 
    data: conversationsData, 
    isLoading
  } = useConversationsQuery();

  // 🔌 WebSocket pour les mises à jour temps réel
  useConversationsSocket();

  // Récupérer les conversations depuis React Query
  const conversations = conversationsData?.data || [];

  // Fonction pour formater le timestamp
  const formatTimestamp = (dateString: string) => {
    try {
      const messageDate = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'à l\'instant';
      } else if (diffInMinutes < 60) {
        return `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
      } else {
        return format(messageDate, 'dd/MM/yyyy', { locale: fr });
      }
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'il y a longtemps';
    }
  };

  // Fonction pour obtenir le dernier message d'une conversation
  const getLastMessage = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return { text: 'Aucun message', timestamp: conversation.createdAt };
    }
    
    // Trier par date et prendre le plus récent
    const sortedMessages = conversation.messages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const lastMessage = sortedMessages[0];
    return {
      text: lastMessage.body || 'Message sans contenu',
      timestamp: lastMessage.createdAt
    };
  };

  // Filtrage des conversations
  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customerName = `${conversation.customer.first_name} ${conversation.customer.last_name}`.toLowerCase();
    const customerPhone = conversation.customer.phone?.toLowerCase() || '';
    const lastMessage = getLastMessage(conversation).text.toLowerCase();
    
    return customerName.includes(searchLower) || 
           customerPhone.includes(searchLower) || 
           lastMessage.includes(searchLower);
  });

  return (
    <div className="h-full flex flex-col   lg:w-96 xl:w-[400px] 2xl:w-[450px] md:w-80 w-full">
      {/* Header */}
      <div className="p-3 md:p-6 border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="lg:text-2xl md:text-lg text-base font-bold text-orange-500">Conversations</h1>
          {/* Bouton Nouvelle conversation - Temporairement désactivé */}
          {/* 
          <button 
            onClick={() => {
              console.log('Bouton Nouvelle cliqué');
              onNewConversation?.();
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white md:px-4 md:py-2 px-3 py-2.5 cursor-pointer rounded-xl md:text-sm text-xs font-medium flex items-center"
          >
            <Plus className="mr-1 md:w-5 md:h-5 w-4 h-4" />
            Nouvelle
          </button>
          */}
        </div>
        
        {/* Search */}
        <div className="relative mb-4 md:mb-6">
          <div className="absolute inset-y-0 left-0 md:pl-4 pl-3 flex items-center pointer-events-none">
            <Search className="md:h-5 md:w-5 h-4 w-4 text-gray-600" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full md:pl-12 pl-10 md:pr-4 pr-3 md:py-3 py-2.5 border border-gray-200 rounded-xl md:text-sm text-xs placeholder-gray-600 focus:outline-none focus:ring-2 cursor-pointer focus:ring-orange-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 md:gap-3">
          <button 
            className="cursor-pointer md:px-4 md:py-2 px-3 py-1.5 rounded-xl md:text-sm text-xs font-medium bg-orange-500 text-white"
          >
            Toutes ({filteredConversations.length})
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Users className="w-12 h-12 mb-4" />
            <p className="text-center">
              {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
            {!searchTerm && (
              <button 
                onClick={onNewConversation}
                className="mt-4 text-orange-500 text-sm underline"
              >
                Créer une nouvelle conversation
              </button>
            )}
          </div>
        )}

        {/* Conversations */}
        {filteredConversations.map((conversation) => {
          const lastMessage = getLastMessage(conversation);
          const customerName = `${conversation.customer.first_name} ${conversation.customer.last_name}`;
          
          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`md:px-4 md:py-4 px-3 py-3 border-b border-slate-300 cursor-pointer hover:bg-gray-50 ${
                selectedConversation === conversation.id ? 'bg-orange-50' : ''
              }`}
            >
              <div className="flex items-start md:space-x-3 space-x-2">
                {/* Avatar du client */}
                <div className="flex-shrink-0">
                  <div className="relative md:w-12 w-10 md:h-12 h-10">
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border-2 border-white overflow-hidden">
                      {conversation.customer.image ? (
                        <Image
                          src={formatImageUrl(conversation.customer.image)}
                          alt={customerName}
                          width={48}
                          height={48}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="md:text-lg text-base font-bold text-gray-600 uppercase">
                          {conversation.customer.first_name?.[0] || '?'}
                          {conversation.customer.last_name?.[0] || ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center justify-between md:mb-2 mb-1">
                    <div className="flex items-center md:space-x-2 space-x-1">
                      <span className="md:text-base text-sm font-semibold text-black">
                        {customerName}
                      </span>
                      {conversation.unreadNumber > 0 && (
                        <span className="bg-red-500 text-white md:text-sm text-xs md:px-2 md:py-1 px-1.5 py-0.5 rounded-full font-medium md:min-w-[24px] md:h-6 min-w-[20px] h-5 flex items-center justify-center">
                          {conversation.unreadNumber}
                        </span>
                      )}
                    </div>
                    <span className="md:text-sm text-xs text-gray-500 whitespace-nowrap">
                      {formatTimestamp(lastMessage.timestamp)}
                    </span>
                  </div>
                  
                  <p className="md:text-base text-sm text-gray-600 truncate md:mb-3 mb-2 leading-relaxed">
                    {lastMessage.text}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="border-gray-200 border text-gray-700 md:px-3 md:py-1 px-2 py-0.5 rounded-full md:text-sm text-xs font-medium">
                      {conversation.restaurant?.name || 'Chicken Nation'}
                    </span>
                    <span className="md:text-sm text-xs text-gray-500 font-medium">
                      {conversation.customer.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default ConversationsList;
