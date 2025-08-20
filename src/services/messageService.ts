import { apiRequest } from '@/services/api'
import { mockConversations, mockMessages, mockStats } from '@/data/mockMessages'

// Mode simulation - toujours actif car l'endpoint n'existe pas encore
const USE_MOCK_DATA = true

// Types pour les messages
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'CLIENT' | 'BACKOFFICE'
  content: string
  message_type: 'TEXT' | 'IMAGE' | 'FILE'
  file_url?: string
  is_read: boolean
  created_at: string
  updated_at: string
  // Informations du sender
  sender?: {
    id: string
    fullname: string
    email: string
    image?: string
    user_type?: string
  }
}

export interface Conversation {
  id: string
  client_id: string
  last_message_at: string
  unread_count: number
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  created_at: string
  updated_at: string
  // Informations du client
  client: {
    id: string
    fullname: string
    email: string
    phone?: string
    image?: string
    user_type?: string
    is_connected?: boolean
  }
  // Dernier message pour l'aperçu
  last_message?: {
    id: string
    content: string
    sender_type: 'CLIENT' | 'BACKOFFICE'
    message_type: 'TEXT' | 'IMAGE' | 'FILE'
    created_at: string
  }
}

export interface MessageStats {
  total_conversations: number
  unread_conversations: number
  total_messages: number
  unread_messages: number
}

// ✅ Récupérer toutes les conversations
export const getConversations = async (): Promise<Conversation[]> => {
  try {
     

    // Mode développement avec données mockées
    if (USE_MOCK_DATA) {
  
      await new Promise(resolve => setTimeout(resolve, 500)) // Simuler un délai réseau
      return mockConversations
    }

    const response = await apiRequest<Conversation[]>('/messages/conversations', 'GET')

     
    return response
  } catch (error) {
    console.error('❌ [getConversations] Erreur:', error)
    throw error
  }
}

// ✅ Récupérer les messages d'une conversation
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
     

    // Mode développement avec données mockées
    if (USE_MOCK_DATA) {
     
      await new Promise(resolve => setTimeout(resolve, 300)) // Simuler un délai réseau
      return mockMessages[conversationId] || []
    }

    const response = await apiRequest<Message[]>(`/messages/conversations/${conversationId}/messages`, 'GET')

 
    return response
  } catch (error) {
    console.error('❌ [getMessages] Erreur:', error)
    throw error
  }
}

// ✅ Envoyer un message
export const sendMessage = async (conversationId: string, content: string, messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT', file?: File): Promise<Message> => {
  try {
  

    // Mode développement avec données mockées
    if (USE_MOCK_DATA) {
       
      await new Promise(resolve => setTimeout(resolve, 800)) // Simuler un délai réseau

      const mockMessage: Message = {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: 'backoffice-1',
        sender_type: 'BACKOFFICE',
        content,
        message_type: messageType,
        file_url: file ? URL.createObjectURL(file) : undefined,
        is_read: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: {
          id: 'backoffice-1',
          fullname: 'Support Chicken Nation',
          email: 'support@chickennation.com'
        }
      }

      return mockMessage
    }

    if (messageType === 'TEXT') {
      const response = await apiRequest<Message>(`/messages/conversations/${conversationId}/messages`, 'POST', {
        content,
        message_type: messageType
      })

  
      return response
    } else {
      // Pour les fichiers, utiliser FormData
      const formData = new FormData()
      formData.append('content', content)
      formData.append('message_type', messageType)
      if (file) {
        formData.append('file', file)
      }

      const response = await apiRequest<Message>(`/messages/conversations/${conversationId}/messages`, 'POST', formData)

    
      return response
    }
  } catch (error) {
    console.error('❌ [sendMessage] Erreur:', error)
    throw error
  }
}

// ✅ Marquer les messages comme lus
export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  try {
     

    // Mode développement avec données mockées
    if (USE_MOCK_DATA) {
      
      await new Promise(resolve => setTimeout(resolve, 200)) // Simuler un délai réseau
      return
    }

    await apiRequest(`/messages/conversations/${conversationId}/read`, 'POST')
  } catch (error) {
    console.error('❌ [markMessagesAsRead] Erreur:', error)
    throw error
  }
}

// ✅ Récupérer les statistiques des messages
export const getMessageStats = async (): Promise<MessageStats> => {
  try {
    

    // Mode développement avec données mockées
    if (USE_MOCK_DATA) {
      
      await new Promise(resolve => setTimeout(resolve, 200)) // Simuler un délai réseau
      return mockStats
    }

    const response = await apiRequest<MessageStats>('/messages/stats', 'GET')

     
    return response
  } catch (error) {
    console.error('❌ [getMessageStats] Erreur:', error)
    throw error
  }
}

// ✅ Créer une nouvelle conversation (si nécessaire)
export const createConversation = async (clientId: string): Promise<Conversation> => {
  try {
   

    const response = await apiRequest<Conversation>('/messages/conversations', 'POST', {
      client_id: clientId
    })

     
    return response
  } catch (error) {
    console.error('❌ [createConversation] Erreur:', error)
    throw error
  }
}

// ✅ Archiver une conversation
export const archiveConversation = async (conversationId: string): Promise<void> => {
  try {
 

    await apiRequest(`/messages/conversations/${conversationId}/archive`, 'POST')

    
  } catch (error) {
    console.error('❌ [archiveConversation] Erreur:', error)
    throw error
  }
}

// ✅ Fermer une conversation
export const closeConversation = async (conversationId: string): Promise<void> => {
  try {
 
    await apiRequest(`/messages/conversations/${conversationId}/close`, 'POST')

    console.log('✅ [closeConversation] Conversation fermée')
  } catch (error) {
    console.error('❌ [closeConversation] Erreur:', error)
    throw error
  }
}
