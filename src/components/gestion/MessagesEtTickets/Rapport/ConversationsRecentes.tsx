"use client";

import React from 'react';
import Image from 'next/image';

// Types pour les données mockées
interface ConversationData {
  id: string;
  type: 'client' | 'interne';
  name: string;
  message: string;
  unreadCount: number;
  isRead: boolean;
  timestamp: string;
}

// Données mockées
const mockConversations: ConversationData[] = [
  {
    id: '1',
    type: 'client',
    name: 'Katrina Traoré',
    message: 'Je comprends votre frustration. Je vais escalader ...',
    unreadCount: 1,
    isRead: false,
    timestamp: 'il y a 5 minutes'
  },
  {
    id: '2',
    type: 'interne',
    name: 'Marie Dubois',
    message: 'Oui, je viens de vérifier. Tout semble normal. Peu...',
    unreadCount: 0,
    isRead: true,
    timestamp: 'il y a 15 minutes'
  },
  {
    id: '3',
    type: 'client',
    name: 'Lucas Bernard',
    message: 'Bonjour, je voudrais annuler ma commande, je ne pe...',
    unreadCount: 2,
    isRead: false,
    timestamp: 'il y a environ 1 heure'
  }
];

// Composant pour une conversation individuelle
interface ConversationItemProps {
  conversation: ConversationData;
}

function ConversationItem({ conversation }: ConversationItemProps) {
  const getBadgeContent = () => {
    if (conversation.isRead) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-gray-200 text-slate-700 mb-2">
          Lu
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-red-500 text-white mb-2">
          {conversation.unreadCount} non lu{conversation.unreadCount > 1 ? 's' : ''}
        </span>
      );
    }
  };

  return (
    <div className="flex items-center space-x-4 ">
      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <p className="md:text-sm lg:text-sm text-xs font-semibold text-gray-700 mb-0.5">
              {conversation.type === 'client' ? 'Client' : 'Interne'}: {conversation.name}
            </p>
            <p className="md:text-xs lg:text-sm text-xs text-gray-600">
              {conversation.message}
            </p>
          </div>
          <div className="flex flex-col items-end ml-4">
            {getBadgeContent()}
            <p className="md:text-[10px] lg:text-sm text-[10px] text-gray-400">{conversation.timestamp}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationsRecentes() {
  return (
    <div className="bg-white rounded-2xl border-0 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-6 ">
        <div className="flex items-center justify-between">
          <h3 className="lg:text-2xl md:text-base text-md font-semibold text-gray-900 flex items-center">
            <Image
              src="/icons/rapport/conversation.png"
              alt="Conversations"
              width={22}
              height={22}
              className="mr-2 self-center mt-1"
            />
            Conversations récentes
          </h3>
          <button className="md:text-xs text-xs border-1 border-slate-400 md:p-1.5 p-1 px-2 md:px-2.5 cursor-pointer rounded-xl text-gray-600 hover:text-gray-800 font-medium">
            Voir tout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1">
        <div className="space-y-3">
          {mockConversations.map((conversation) => (
            <ConversationItem 
              key={conversation.id} 
              conversation={conversation} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ConversationsRecentes;
