"use client"

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, MoreVertical, Archive, X as CloseIcon, Phone, Video } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Conversation } from '@/services/messageService'
import { useMessageStore } from '@/store/messageStore'
import { formatImageUrl } from '@/utils/imageHelpers'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

interface ChatWindowProps {
  conversation: Conversation
  onBack: () => void
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onBack }) => {
  const [messageText, setMessageText] = useState('')
  const [showActions, setShowActions] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    isLoadingMessages,
    isSending,
    error,
    fetchMessages,
    sendNewMessage,
    markAsRead,
    archiveConv,
    closeConv
  } = useMessageStore()

  // Charger les messages de la conversation
  useEffect(() => {
    if (conversation.id) {
      console.log('💬 [ChatWindow] Chargement des messages pour:', conversation.id)
      fetchMessages(conversation.id)
      
      // Marquer comme lu après un délai
      setTimeout(() => {
        if (conversation.unread_count > 0) {
          markAsRead(conversation.id)
        }
      }, 1000)
    }
  }, [conversation.id, fetchMessages, markAsRead, conversation.unread_count])

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return

    try {
      const messageType = selectedFile ? (selectedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE') : 'TEXT'
      const content = messageText.trim() || (selectedFile ? selectedFile.name : '')

      await sendNewMessage(conversation.id, content, messageType, selectedFile || undefined)
      
      setMessageText('')
      setSelectedFile(null)
      
      // ✅ SÉCURITÉ: Log minimal en production
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [ChatWindow] Message envoyé avec succès')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [ChatWindow] Erreur lors de l\'envoi:', error)
      }
      toast.error('Erreur lors de l\'envoi du message')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 5MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleArchive = async () => {
    try {
      await archiveConv(conversation.id)
      toast.success('Conversation archivée')
      setShowActions(false)
    } catch {
      toast.error('Erreur lors de l\'archivage')
    }
  }

  const handleClose = async () => {
    try {
      await closeConv(conversation.id)
      toast.success('Conversation fermée')
      setShowActions(false)
    } catch {
      toast.error('Erreur lors de la fermeture')
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isOnline = conversation.client.is_connected

  return (
    <div className="flex flex-col h-full">
      {/* Header de la conversation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Retour à la liste des conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              <Image
                src={formatImageUrl(conversation.client.image) || "/icons/header/default-avatar.png"}
                alt={conversation.client.fullname}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900">{conversation.client.fullname}</h3>
            <p className="text-sm text-gray-500">
              {isOnline ? 'En ligne' : `Vu ${formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: fr })}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Appel vocal">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Appel vidéo">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Menu d'actions"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  type="button"
                  onClick={handleArchive}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archiver</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                >
                  <CloseIcon className="w-4 h-4" />
                  <span>Fermer</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-4">
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 p-8">
            <p>Aucun message dans cette conversation</p>
            <p className="text-sm">Commencez la discussion !</p>
          </div>
        ) : (
          messages.map((message) => {
            const isFromClient = message.sender_type === 'CLIENT'
            
            return (
              <div
                key={message.id}
                className={`flex ${isFromClient ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`
                  max-w-xs lg:max-w-md px-4 py-2 rounded-2xl
                  ${isFromClient 
                    ? 'bg-white text-gray-900 rounded-bl-sm' 
                    : 'bg-[#F17922] text-white rounded-br-sm'
                  }
                  shadow-sm
                `}>
                  {message.message_type === 'IMAGE' && message.file_url && (
                    <div className="mb-2">
                      <Image
                        src={formatImageUrl(message.file_url)}
                        alt="Image partagée"
                        width={200}
                        height={200}
                        className="rounded-lg max-w-full h-auto"
                        unoptimized
                      />
                    </div>
                  )}
                  
                  {message.message_type === 'FILE' && message.file_url && (
                    <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-100 rounded-lg">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm truncate">{message.content}</span>
                    </div>
                  )}
                  
                  {message.message_type === 'TEXT' && (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  <p className={`text-xs mt-1 ${isFromClient ? 'text-gray-500' : 'text-orange-100'}`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <Paperclip className="w-5 h-5 text-gray-600" />
              )}
              <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:bg-gray-200 rounded-full"
              title="Supprimer le fichier"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            aria-label="Sélectionner un fichier à joindre"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#F17922] focus:border-transparent resize-none min-h-[40px] max-h-[120px]"
            />
          </div>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={(!messageText.trim() && !selectedFile) || isSending}
            className={`
              p-2 rounded-full transition-colors
              ${(!messageText.trim() && !selectedFile) || isSending
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#F17922] hover:bg-orange-600'
              }
            `}
            aria-label="Envoyer le message"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
