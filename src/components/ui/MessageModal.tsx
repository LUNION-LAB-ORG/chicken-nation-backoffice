"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Archive, MessageCircle, Users } from 'lucide-react'
// import { Clock } from 'lucide-react' // Non utilisé actuellement
import { useMessageStore } from '@/store/messageStore'
import ConversationList from './ConversationList'
import ChatWindow from './ChatWindow'
import { Conversation } from '@/services/messageService'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'archived'>('all')
  
  const {
    conversations,
    currentConversation,
    stats,
    isLoading,
    error,
    fetchConversations,
    fetchStats,
    setCurrentConversation,
    clearError
  } = useMessageStore()

  // Charger les données au montage du modal
  useEffect(() => {
    if (isOpen) {
      console.log('📱 [MessageModal] Modal ouvert, chargement des données')
      fetchConversations()
      fetchStats()
    }
  }, [isOpen, fetchConversations, fetchStats])

  // Nettoyer les erreurs quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      clearError()
      setCurrentConversation(null)
    }
  }, [isOpen, clearError, setCurrentConversation])

  // Filtrer les conversations selon la recherche et l'onglet
  const filteredConversations = conversations.filter(conv => {
    // Filtre par recherche
    const matchesSearch = !searchQuery.trim() || 
      conv.client.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtre par onglet
    const matchesTab = 
      selectedTab === 'all' ? conv.status !== 'ARCHIVED' :
      selectedTab === 'unread' ? conv.unread_count > 0 && conv.status !== 'ARCHIVED' :
      selectedTab === 'archived' ? conv.status === 'ARCHIVED' : true

    return matchesSearch && matchesTab
  })

  const handleConversationSelect = (conversation: Conversation) => {
    console.log('💬 [MessageModal] Sélection de la conversation:', conversation.id)
    setCurrentConversation(conversation)
  }

  const handleBackToList = () => {
    setCurrentConversation(null)
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden relative" style={{ zIndex: 1000000 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#F17922] to-[#FA6345]">
          <div className="flex items-center space-x-4">
            <MessageCircle className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Messages</h2>
              <p className="text-orange-100 text-sm">
                Conversations avec les clients
              </p>
            </div>
          </div>
          
          {/* Statistiques */}
          {stats && (
            <div className="hidden md:flex items-center space-x-6 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_conversations}</div>
                <div className="text-xs text-orange-100">Conversations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.unread_conversations}</div>
                <div className="text-xs text-orange-100">Non lues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.unread_messages}</div>
                <div className="text-xs text-orange-100">Messages</div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Liste des conversations */}
          <div className={`${currentConversation ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-1/3 border-r border-gray-200 bg-gray-50`}>
            {/* Barre de recherche et onglets */}
            <div className="p-4 space-y-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Onglets */}
              <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Toutes
                </button>
                <button
                  onClick={() => setSelectedTab('unread')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === 'unread'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  Non lues
                  {stats && stats.unread_conversations > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {stats.unread_conversations}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSelectedTab('archived')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === 'archived'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Archive className="w-4 h-4 inline mr-1" />
                  Archivées
                </button>
              </div>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-600">
                  <p className="font-medium">Erreur de chargement</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  selectedConversation={currentConversation}
                  onSelectConversation={handleConversationSelect}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </div>

          {/* Zone de chat */}
          <div className={`${currentConversation ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
            {currentConversation ? (
              <ChatWindow
                conversation={currentConversation}
                onBack={handleBackToList}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
                  <p className="text-sm">Choisissez une conversation pour commencer à discuter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Utiliser createPortal pour rendre le modal à la racine du DOM
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}

export default MessageModal
