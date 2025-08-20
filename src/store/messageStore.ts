import { create } from 'zustand'
import { 
  Message, 
  Conversation, 
  MessageStats,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getMessageStats,
  createConversation,
  archiveConversation,
  closeConversation
} from '@/services/messageService'

interface MessageState {
  // État des données
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  stats: MessageStats | null
  
  // États de chargement
  isLoading: boolean
  isLoadingMessages: boolean
  isSending: boolean
  
  // Erreurs
  error: string | null
  
  // Actions
  fetchConversations: () => Promise<void>
  fetchMessages: (conversationId: string) => Promise<void>
  sendNewMessage: (conversationId: string, content: string, messageType?: 'TEXT' | 'IMAGE' | 'FILE', file?: File) => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  fetchStats: () => Promise<void>
  createNewConversation: (clientId: string) => Promise<void>
  archiveConv: (conversationId: string) => Promise<void>
  closeConv: (conversationId: string) => Promise<void>
  
  // Utilitaires
  setCurrentConversation: (conversation: Conversation | null) => void
  clearError: () => void
  reset: () => void
}

export const useMessageStore = create<MessageState>((set, get) => ({
  // État initial
  conversations: [],
  currentConversation: null,
  messages: [],
  stats: null,
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,

  // ✅ Récupérer toutes les conversations
  fetchConversations: async () => {
    try {
      set({ isLoading: true, error: null })
      
      
      const conversations = await getConversations()
      
      set({ 
        conversations,
        isLoading: false 
      })
      
   
    } catch (error) {
      console.error('❌ [MessageStore] Erreur lors du chargement des conversations:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des conversations',
        isLoading: false 
      })
    }
  },

  // ✅ Récupérer les messages d'une conversation
  fetchMessages: async (conversationId: string) => {
    try {
      set({ isLoadingMessages: true, error: null })
  
      
      const messages = await getMessages(conversationId)
      
      set({ 
        messages,
        isLoadingMessages: false 
      })
      
  
    } catch (error) {
      console.error('❌ [MessageStore] Erreur lors du chargement des messages:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des messages',
        isLoadingMessages: false 
      })
    }
  },

  // ✅ Envoyer un nouveau message
  sendNewMessage: async (conversationId: string, content: string, messageType = 'TEXT', file?: File) => {
    try {
      set({ isSending: true, error: null })
   
      
      const newMessage = await sendMessage(conversationId, content, messageType, file)
      
      // Ajouter le message à la liste actuelle
      const currentMessages = get().messages
      set({ 
        messages: [...currentMessages, newMessage],
        isSending: false 
      })
      
      // Mettre à jour la conversation dans la liste
      const conversations = get().conversations
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId 
          ? {
              ...conv,
              last_message_at: newMessage.created_at,
              last_message: {
                id: newMessage.id,
                content: newMessage.content,
                sender_type: newMessage.sender_type,
                message_type: newMessage.message_type,
                created_at: newMessage.created_at
              }
            }
          : conv
      )
      
      set({ conversations: updatedConversations })
      
     
    } catch (error) {
      console.error('❌ [MessageStore] Erreur lors de l\'envoi du message:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message',
        isSending: false 
      })
    }
  },

  // ✅ Marquer les messages comme lus
  markAsRead: async (conversationId: string) => {
    try {
       
      
      await markMessagesAsRead(conversationId)
      
      // Mettre à jour l'état local
      const conversations = get().conversations
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
      
      const messages = get().messages
      const updatedMessages = messages.map(msg => 
        msg.conversation_id === conversationId 
          ? { ...msg, is_read: true }
          : msg
      )
      
      set({ 
        conversations: updatedConversations,
        messages: updatedMessages 
      })
      
      console.log('✅ [MessageStore] Messages marqués comme lus')
    } catch (error) {
      console.error('❌ [MessageStore] Erreur lors du marquage comme lu:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du marquage comme lu'
      })
    }
  },

  // ✅ Récupérer les statistiques
  fetchStats: async () => {
    try {
     
      
      const stats = await getMessageStats()
      
      set({ stats })
      
      
    } catch (error) {
      console.error('❌ [MessageStore] Erreur lors du chargement des statistiques:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques'
      })
    }
  },

  // ✅ Créer une nouvelle conversation
  createNewConversation: async (clientId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      
      const newConversation = await createConversation(clientId)
      
      const conversations = get().conversations
      set({ 
        conversations: [newConversation, ...conversations],
        currentConversation: newConversation,
        isLoading: false 
      })
      
     
    } catch (error) {
      console.error('❌ [MessageStore] Erreur lors de la création de la conversation:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la création de la conversation',
        isLoading: false 
      })
    }
  },

  // ✅ Archiver une conversation
  archiveConv: async (conversationId: string) => {
    try {
     
      
      await archiveConversation(conversationId)
      
      // Mettre à jour l'état local
      const conversations = get().conversations
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, status: 'ARCHIVED' as const }
          : conv
      )
      
      set({ conversations: updatedConversations })
      
      
    } catch (error) {
      console.error('❌ [MessageStore] Erreur lors de l\'archivage:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'archivage'
      })
    }
  },

  // ✅ Fermer une conversation
  closeConv: async (conversationId: string) => {
    try {
      
      
      await closeConversation(conversationId)
      
      // Mettre à jour l'état local
      const conversations = get().conversations
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, status: 'CLOSED' as const }
          : conv
      )
      
      set({ conversations: updatedConversations })
      
    
    } catch (error) {
      console.error('❌ [MessageStore] Erreur lors de la fermeture:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la fermeture'
      })
    }
  },

  // ✅ Utilitaires
  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation })
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      stats: null,
      isLoading: false,
      isLoadingMessages: false,
      isSending: false,
      error: null
    })
  }
}))
