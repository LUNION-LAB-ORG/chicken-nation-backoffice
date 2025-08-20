"use client"

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MessageCircle, Image as ImageIcon, File, Clock } from 'lucide-react'
// import { CheckCircle2 } from 'lucide-react' // Non utilisé actuellement
import { Conversation } from '@/services/messageService'
import { formatImageUrl } from '@/utils/imageHelpers'
import Image from 'next/image'

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  searchQuery: string
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchQuery
}) => {
  
  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'IMAGE':
        return <ImageIcon className="w-4 h-4" />
      case 'FILE':
        return <File className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const getMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) {
      return 'Aucun message'
    }

    const { content, message_type, sender_type } = conversation.last_message
    const prefix = sender_type === 'CLIENT' ? '' : 'Vous: '

    switch (message_type) {
      case 'IMAGE':
        return `${prefix}📷 Image`
      case 'FILE':
        return `${prefix}📎 Fichier`
      default:
        return `${prefix}${content}`
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-800 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
        <h3 className="font-medium mb-2">Aucune conversation</h3>
        <p className="text-sm text-center">
          {searchQuery.trim() 
            ? 'Aucune conversation ne correspond à votre recherche'
            : 'Les conversations avec les clients apparaîtront ici'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conversation) => {
        const isSelected = selectedConversation?.id === conversation.id
        const hasUnread = conversation.unread_count > 0
        const isOnline = conversation.client.is_connected

        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`
              relative p-4 rounded-lg cursor-pointer transition-all duration-200
              ${isSelected 
                ? 'bg-orange-50 border-2 border-orange-200 shadow-sm' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
              }
              ${hasUnread ? 'ring-2 ring-orange-100' : ''}
            `}
          >
            {/* Badge non lu */}
            {hasUnread && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </div>
            )}

            <div className="flex items-start space-x-3">
              {/* Avatar du client */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  <Image
                    src={formatImageUrl(conversation.client.image) || "/icons/header/default-avatar.png"}
                    alt={conversation.client.fullname}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                
                {/* Indicateur en ligne */}
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Contenu de la conversation */}
              <div className="flex-1 min-w-0">
                {/* Nom et heure */}
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                    {highlightText(conversation.client.fullname, searchQuery)}
                  </h4>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </span>
                  </div>
                </div>

                {/* Email du client */}
                <p className="text-xs text-gray-500 mb-2 truncate">
                  {highlightText(conversation.client.email, searchQuery)}
                </p>

                {/* Dernier message */}
                <div className="flex items-center space-x-2">
                  <div className="text-gray-400">
                    {conversation.last_message && getMessageIcon(conversation.last_message.message_type)}
                  </div>
                  <p className={`text-sm truncate flex-1 ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {highlightText(getMessagePreview(conversation), searchQuery)}
                  </p>
                </div>

                {/* Statut de la conversation */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    {/* Type d'utilisateur */}
                    {conversation.client.user_type && (
                      <span className={`
                        text-xs px-2 py-1 rounded-full font-medium
                        ${conversation.client.user_type === 'PREMIUM' 
                          ? 'bg-purple-100 text-purple-700' 
                          : conversation.client.user_type === 'GOLD'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                        }
                      `}>
                        {conversation.client.user_type}
                      </span>
                    )}

                    {/* Statut de la conversation */}
                    {conversation.status === 'CLOSED' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                        Fermée
                      </span>
                    )}
                    {conversation.status === 'ARCHIVED' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        Archivée
                      </span>
                    )}
                  </div>

                  {/* Indicateur de statut en ligne */}
                  <div className="flex items-center space-x-1">
                    {isOnline ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium">En ligne</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Hors ligne</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ConversationList
