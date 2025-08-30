import { apiRequest } from '@/services/api'
import { Message, Conversation, MessageStats, PaginatedResponse } from '@/types/messaging'

// ✅ Récupérer toutes les conversations avec pagination
export const getConversations = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Conversation>> => {
  try {
     
    const response = await apiRequest<PaginatedResponse<Conversation>>(`/conversations?page=${page}&limit=${limit}`, 'GET')
    
    return response
  } catch (error) {
    console.error('❌ [getConversations] Erreur:', error)
    throw error
  }
}


export const getMessages = async (conversationId: string, page?: number, limit?: number): Promise<PaginatedResponse<Message>> => {
  try {
    // Construire dynamiquement la query string uniquement si des paramètres sont fournis
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', String(page));
    if (limit !== undefined) params.append('limit', String(limit));
    const queryString = params.toString() ? `?${params.toString()}` : '';

    
    const response = await apiRequest<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages${queryString}`, 'GET');
    

    return response;
  } catch (error) {
    console.error('❌ [getMessages] Erreur:', error);
    throw error;
  }
}


export const sendMessage = async (conversationId: string, content: string, messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT', file?: File): Promise<Message> => {
  try {
    if (messageType === 'TEXT') {
      const response = await apiRequest<Message>(`/conversations/${conversationId}/messages`, 'POST', {
        body: content
      })
      return response
    } else {
      // Pour les fichiers, utiliser FormData
      const formData = new FormData()
      formData.append('body', content)
      formData.append('message_type', messageType)
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    }
  } catch (error) {
    console.error('❌ [sendMessage] Erreur:', error)
    throw error
  }
}

// ✅ Marquer les messages comme lus
export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  try {
   
    await apiRequest(`/conversations/${conversationId}/read`, 'POST')
    
  } catch (error) {
    console.warn(`⚠️ [markMessagesAsRead] Impossible de marquer les messages comme lus:`, error)
    
  }
}

// ✅ Obtenir les statistiques des messages
export const getMessageStats = async (): Promise<MessageStats> => {
  try {
   
    const response = await apiRequest<MessageStats>('/conversations/stats', 'GET')
    
    return response
  } catch {
    
    return {
      total_conversations: 0,
      unread_conversations: 0,
      total_messages: 0,
      unread_messages: 0
    }
  }
}

// ✅ Créer une nouvelle conversation 
export const createConversation = async (clientId: string): Promise<Conversation> => {
  try {
    const response = await apiRequest<Conversation>('/conversations', 'POST', {
      receiver_user_id: clientId
    })
    return response
  } catch (error) {
    console.error('❌ [createConversation] Erreur:', error)
    throw error
  }
}

// ✅ Créer une nouvelle conversation en utilisant le DTO complet
export type CreateConversationDto = {
  receiver_user_id?: string
  seed_message: string
  restaurant_id?: string
  subject?: string
  customer_to_contact_id?: string
}

export const createConversationWithDto = async (dto: CreateConversationDto): Promise<Conversation> => {
  try {
    const payload: Partial<CreateConversationDto> = {
      seed_message: dto.seed_message
    }

    if (dto.receiver_user_id) payload.receiver_user_id = dto.receiver_user_id
    if (dto.customer_to_contact_id) payload.customer_to_contact_id = dto.customer_to_contact_id
    if (dto.restaurant_id) payload.restaurant_id = dto.restaurant_id
    if (dto.subject) payload.subject = dto.subject

   
    const response = await apiRequest<Conversation>('/conversations', 'POST', payload)
    
    return response
  } catch (error) {
    console.error('❌ [createConversationWithDto] Erreur:', error)
    throw error
  }
}

// ✅ Archiver une conversation
export const archiveConversation = async (conversationId: string): Promise<void> => {
  try {
    await apiRequest(`/conversations/${conversationId}/archive`, 'POST')
  } catch (error) {
    console.error('❌ [archiveConversation] Erreur:', error)
    throw error
  }
}

// ✅ Fermer une conversation
export const closeConversation = async (conversationId: string): Promise<void> => {
  try {
    await apiRequest(`/conversations/${conversationId}/close`, 'POST')
  } catch (error) {
    console.error('❌ [closeConversation] Erreur:', error)
    throw error
  }
}

// ✅ Marquer une conversation comme lue
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  try {
    await markMessagesAsRead(conversationId)
  } catch (error) {
    console.warn('⚠️ [markConversationAsRead] Impossible de marquer la conversation comme lue:', error)
    // On continue malgré l'erreur
  }
}
export type { Message }

