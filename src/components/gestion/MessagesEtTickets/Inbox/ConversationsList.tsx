"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Users } from 'lucide-react';
import { useConversationsQuery } from '@/hooks/useConversationsQuery';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface adaptée au composant
interface ConversationDisplayItem {
  id: string;
  type: 'client' | 'interne';
  clientName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  restaurant: string;
  assignedTo: string;
  isActive?: boolean;
}

interface ConversationsListProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation?: () => void;
}

function ConversationsList({ selectedConversation, onSelectConversation, onNewConversation }: ConversationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'client' | 'internal'>('all');

  // 🔌 React Query hooks
  const { 
    data: conversationsData, 
    isLoading
  } = useConversationsQuery();

  // Récupérer les conversations depuis React Query
  const conversations = conversationsData?.data || [];

  // Transformation des données du store pour le composant
  const displayConversations: ConversationDisplayItem[] = (conversations || [])
    .filter(conv => {
      // Filtrage par terme de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          conv.client?.fullname?.toLowerCase().includes(searchLower) ||
          conv.last_message?.content?.toLowerCase().includes(searchLower) ||
          conv.client?.email?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(() => {
      // Filtrage par type (tous les conversations sont considérées comme 'client' pour l'instant)
      if (filter === 'client') return true;
      if (filter === 'internal') return false; // Pas de conversations internes pour l'instant
      return true;
    })
    .map(conv => {
      // Formatage de la date
      let timestamp = 'il y a longtemps';
      if (conv.last_message_at) {
        try {
          const messageDate = new Date(conv.last_message_at);
          const now = new Date();
          const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
          
          if (diffInMinutes < 1) {
            timestamp = 'à l\'instant';
          } else if (diffInMinutes < 60) {
            timestamp = `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
          } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            timestamp = `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
          } else {
            timestamp = format(messageDate, 'dd/MM/yyyy', { locale: fr });
          }
        } catch (error) {
          console.error('Erreur formatage date:', error);
        }
      }

      return {
        id: conv.id,
        type: 'client' as const,
        clientName: conv.client?.fullname || conv.client?.email || 'Client inconnu',
        lastMessage: conv.last_message?.content || 'Aucun message',
        timestamp,
        unreadCount: conv.unread_count || 0,
        restaurant: 'Chicken Nation', // Valeur par défaut
        assignedTo: 'Support',
        isActive: false
      };
    });

  return (
    <div className="h-full flex flex-col   lg:w-96 xl:w-[400px] 2xl:w-[450px] md:w-80 w-full">
      {/* Header */}
      <div className="p-3 md:p-6 border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="lg:text-2xl md:text-lg text-base font-bold text-orange-500">Conversations</h1>
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
            onClick={() => setFilter('all')}
            className={`cursor-pointer md:px-4 md:py-2 px-3 py-1.5 rounded-xl md:text-sm text-xs font-regular ${
              filter === 'all' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Toutes ({(conversations || []).length})
          </button>
          <button 
            onClick={() => setFilter('client')}
            className={`cursor-pointer md:px-4 md:py-2 px-3 py-1.5 rounded-xl md:text-sm text-xs font-medium ${
              filter === 'client' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Clients ({(conversations || []).length})
          </button>
          <button 
            onClick={() => setFilter('internal')}
            className={`cursor-pointer md:px-4 md:py-2 px-3 py-1.5 rounded-xl md:text-sm text-xs font-regular ${
              filter === 'internal' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Internes (0)
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

        {/* React Query gère les erreurs automatiquement - pas d'affichage d'erreur manuel */}

        {/* Empty state */}
        {!isLoading && displayConversations.length === 0 && (
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
        {displayConversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`md:px-4 md:py-4 px-3 py-3 border-b border-slate-300 cursor-pointer hover:bg-gray-50 ${
              selectedConversation === conversation.id ? 'bg-orange-50' : ''
            }`}
          >
            <div className="flex items-start md:space-x-3 space-x-2">
              {/* Avatar et indicateur */}
              <div className="flex-shrink-0">
                {conversation.type === 'client' ? (
                  /* Conversations client - 2 avatars alignés horizontalement */
                  <div className="relative md:w-14 w-12 md:h-12 h-10">
                    {/* Avatar client - À gauche */}
                    <div className="absolute left-0 top-0 md:w-12 md:h-12 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white z-10">
                      <Image
                        src="/icons/imageprofile.png"
                        alt="Client"
                        width={36}
                        height={36}
                        className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  /* Conversations internes - 3 avatars */
                  <div className="relative md:w-16 w-14 md:h-16 h-14">
                    {/* Avatar 1 - À gauche */}
                    <div className="absolute left-0 top-0 md:w-10 md:h-10 w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white z-10">
                      <Users className="md:w-6 md:h-6 w-5 h-5 text-slate-400" />
                    </div>
                    {/* Avatar 2 - À droite, chevauche légèrement l'avatar 1 */}
                    <div className="absolute  md:left-8 left-8 top-0 md:w-10 md:h-10 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white z-20">
                      <span className="md:text-xs text-[10px] font-bold text-gray-600">MD</span>
                    </div>
                    {/* Avatar 3 - En bas à droite, chevauche légèrement l'avatar 2 */}
                    <div className="absolute md:left-8 left-7 md:top-6 top-5 md:w-10 md:h-10 w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white z-30">
                      <Image
                        src="/icons/imageprofile.png"
                        alt="Agent"
                        width={32}
                        height={32}
                        className="md:w-8 md:h-8 w-7 h-7 rounded-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1  ml-3  min-w-0">
                <div className="flex items-center justify-between md:mb-2 mb-1">
                  <div className="flex items-center md:space-x-2 space-x-1">
                    <span className="md:text-base text-sm font-medium text-black">
                      {conversation.type === 'client' ? 'Client:' : 'Conversation interne'}
                    </span>
                    <span className="md:text-base text-sm font-semibold text-black">
                      {conversation.clientName}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white md:text-sm text-xs md:px-2 md:py-1 px-1.5 py-0.5 rounded-full font-medium md:min-w-[24px] md:h-6 min-w-[20px] h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="md:text-sm text-xs text-gray-500 whitespace-nowrap">{conversation.timestamp}</span>
                </div>
                
                <p className="md:text-base text-sm text-gray-600 truncate md:mb-3 mb-2 leading-relaxed">
                  {conversation.lastMessage}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="border-gray-200 border-1 text-gray-700 md:px-3 md:py-1 px-2 py-0.5 rounded-full md:text-sm text-xs font-medium">
                    {conversation.restaurant}
                  </span>
                  <span className="md:text-sm text-xs text-gray-500 font-medium">{conversation.assignedTo}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConversationsList;
