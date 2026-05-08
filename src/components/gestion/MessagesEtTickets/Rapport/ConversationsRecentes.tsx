"use client";

import React from 'react';
import Image from 'next/image';
import { useConversationsQuery } from '@/hooks/useConversationsQuery';
import { Conversation } from '@/types/messaging';

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

function getConversationName(conv: Conversation): string {
  if (conv.customer) {
    return `${conv.customer.first_name ?? ''} ${conv.customer.last_name ?? ''}`.trim() || 'Client';
  }
  const firstUser = conv.users?.[0];
  return firstUser?.fullName ?? 'Interne';
}

function getLastMessage(conv: Conversation): string {
  const msgs = conv.messages;
  if (!msgs || msgs.length === 0) return '…';
  const last = msgs[msgs.length - 1];
  if (!last?.body) return '…';
  return last.body.length > 50 ? last.body.slice(0, 50) + '…' : last.body;
}

function ConversationItem({ conv }: { conv: Conversation }) {
  const type = conv.customerId ? 'client' : 'interne';
  const name = getConversationName(conv);
  const message = getLastMessage(conv);
  const unreadCount = conv.unreadNumber ?? 0;
  const isRead = unreadCount === 0;

  return (
    <div className="flex items-center space-x-4">
      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <p className="md:text-sm lg:text-sm text-xs font-semibold text-gray-700 mb-0.5">
              {type === 'client' ? 'Client' : 'Interne'}: {name}
            </p>
            <p className="md:text-xs lg:text-sm text-xs text-gray-600">{message}</p>
          </div>
          <div className="flex flex-col items-end ml-4">
            {isRead ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-gray-200 text-slate-700 mb-2">
                Lu
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-red-500 text-white mb-2">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </span>
            )}
            {conv.createdAt && (
              <p className="md:text-[10px] lg:text-sm text-[10px] text-gray-400">
                {getRelativeTime(conv.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationsRecentes() {
  const { data, isLoading, isError } = useConversationsQuery();
  const conversations = data?.data?.slice(0, 3) ?? [];

  return (
    <div className="bg-white rounded-2xl border-0 overflow-hidden h-full flex flex-col">
      <div className="p-3 md:p-6">
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

      <div className="p-6 flex-1">
        {isLoading && (
          <p className="text-sm text-gray-400 text-center py-4">Chargement…</p>
        )}
        {isError && (
          <p className="text-sm text-red-400 text-center py-4">Erreur de chargement</p>
        )}
        {!isLoading && !isError && conversations.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucune conversation récente</p>
        )}
        {!isLoading && !isError && conversations.length > 0 && (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <ConversationItem key={conv.id} conv={conv} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationsRecentes;
