import { create } from "zustand";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getMessageStats,
  createConversation,
  archiveConversation,
  closeConversation,
  Message, 
} from "@/services/messageService";
import { Conversation, MessageStats } from "@/types/messaging";

interface ConversationStore {
  // État
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  stats: MessageStats | null;
  isLoading: boolean;
  error: string | null;
  
  // État pour les messages
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasMorePages: boolean;
  isLoadingMore: boolean;

  // Actions
  fetchConversations: () => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessageToConversation: (conversationId: string, content: string, messageType?: 'TEXT' | 'IMAGE' | 'FILE', file?: File) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  createNewConversation: (clientId: string) => Promise<void>;
  archiveConversationAction: (conversationId: string) => Promise<void>;
  closeConversationAction: (conversationId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
  // Ajouter un nouveau message (pour WebSocket)
  addMessage: (message: Message) => void;
  // Mettre à jour une conversation (pour WebSocket)
  updateConversation: (conversation: Conversation) => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  // État initial
  conversations: [],
  messages: {},
  stats: null,
  isLoading: false,
  error: null,
  isLoadingMessages: false,
  isSendingMessage: false,
  
  // État pagination
  currentPage: 1,
  totalPages: 1,
  hasMorePages: false,
  isLoadingMore: false,

  // Récupérer les conversations
  fetchConversations: async () => {
    set({ isLoading: true, error: null, currentPage: 1 });
    
    try {
      const response = await getConversations(1, 10);
      
      set({
        conversations: response.data,
        isLoading: false,
        currentPage: response.meta.page,
        totalPages: response.meta.totalPages,
        hasMorePages: response.meta.page < response.meta.totalPages,
      });
      
    } catch (error: unknown) {
      console.error("[ConversationStore] Erreur lors de la récupération des conversations:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des conversations";
      set({
        error: errorMessage,
        isLoading: false,
        conversations: [],
        currentPage: 1,
        totalPages: 1,
        hasMorePages: false,
      });
    }
  },

  // Charger plus de conversations (pagination)
  loadMoreConversations: async () => {
    const { currentPage, totalPages, isLoadingMore, conversations } = get();

    if (isLoadingMore || currentPage >= totalPages) {
      return;
    }

    set({ isLoadingMore: true, error: null });

    try {
      const response = await getConversations(currentPage + 1, 10);
      
      set({
        conversations: [...conversations, ...response.data],
        currentPage: response.meta.page,
        totalPages: response.meta.totalPages,
        hasMorePages: response.meta.page < response.meta.totalPages,
        isLoadingMore: false,
      });
    } catch (error: unknown) {
      console.error("[ConversationStore] Erreur lors du chargement de plus de conversations:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement de plus de conversations";
      set({
        error: errorMessage,
        isLoadingMore: false,
      });
    }
  },

  // Récupérer les messages d'une conversation
  fetchMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true, error: null });
    
    try {
      const response = await getMessages(conversationId);
      
      const { messages: currentMessages } = get();
      set({
        messages: {
          ...currentMessages,
          [conversationId]: response.data
        },
        isLoadingMessages: false,
      });
      
    } catch (error: unknown) {
      console.error(`[ConversationStore] Erreur lors de la récupération des messages:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des messages";
      set({
        error: errorMessage,
        isLoadingMessages: false,
      });
    }
  },

  // Envoyer un message
  sendMessageToConversation: async (conversationId: string, content: string, messageType = 'TEXT', file?: File) => {
    console.log(`[ConversationStore] Sending message to conversation ${conversationId}`);
    set({ isSendingMessage: true, error: null });
    
    try {
      const newMessage = await sendMessage(conversationId, content, messageType, file);
      
      // Ajouter le message à l'état local
      const { messages: currentMessages, conversations } = get();
      const conversationMessages = currentMessages[conversationId] || [];
      
      set({
        messages: {
          ...currentMessages,
          [conversationId]: [...conversationMessages, newMessage]
        },
        isSendingMessage: false,
      });

      // Mettre à jour la conversation avec le dernier message
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
      );
      
      set({ conversations: updatedConversations });
      
      console.log(`[ConversationStore] Message sent successfully`);
    } catch (error: unknown) {
      console.error(`[ConversationStore] Erreur lors de l'envoi du message:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi du message";
      set({
        error: errorMessage,
        isSendingMessage: false,
      });
    }
  },

  // Marquer une conversation comme lue
  markConversationAsRead: async (conversationId: string) => {
    try {
      await markMessagesAsRead(conversationId);

      // Mettre à jour l'état local
      const { conversations, stats } = get();
      const conversation = conversations.find(c => c.id === conversationId);
      
      if (conversation && conversation.unread_count > 0) {
        const updatedConversations = conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        );

        // Mettre à jour les stats
        const updatedStats = stats
          ? {
              ...stats,
              unread_conversations: Math.max(0, stats.unread_conversations - 1),
              unread_messages: Math.max(0, stats.unread_messages - conversation.unread_count),
            }
          : null;

        set({
          conversations: updatedConversations,
          stats: updatedStats,
        });
      }
    } catch (error: unknown) {
      console.warn("⚠️ [ConversationStore] Fonctionnalité 'marquer comme lu' temporairement indisponible:", error);
      
      // Même si l'API échoue, on peut quand même mettre à jour l'UI localement
      const { conversations, stats } = get();
      const conversation = conversations.find(c => c.id === conversationId);
      
      if (conversation && conversation.unread_count > 0) {
        console.log("🔄 [ConversationStore] Mise à jour locale du statut de lecture...");
        
        const updatedConversations = conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        );

        const updatedStats = stats
          ? {
              ...stats,
              unread_conversations: Math.max(0, stats.unread_conversations - 1),
              unread_messages: Math.max(0, stats.unread_messages - conversation.unread_count),
            }
          : null;

        set({
          conversations: updatedConversations,
          stats: updatedStats,
        });
      }
      
      // Ne pas propager l'erreur pour ne pas casser l'interface
    }
  },

  // Récupérer les statistiques (non critique - ne pas afficher l'erreur)
  fetchStats: async () => {
    try {
      const stats = await getMessageStats();
      set({ stats });
    } catch (error: unknown) {
      console.warn("Les statistiques de messages ne sont pas disponibles:", error);
      // Ne pas mettre l'erreur dans le store pour éviter d'afficher une erreur à l'utilisateur
      // Les stats ne sont pas critiques pour le fonctionnement de base
      set({ 
        stats: {
          total_conversations: 0,
          unread_conversations: 0,
          total_messages: 0,
          unread_messages: 0
        }
      });
    }
  },

  // Créer une nouvelle conversation
  createNewConversation: async (clientId: string) => {
    try {
      const newConversation = await createConversation(clientId);

      // Ajouter la nouvelle conversation à l'état local
      const { conversations } = get();
      set({
        conversations: [newConversation, ...conversations],
      });
    } catch (error: unknown) {
      console.error("Erreur lors de la création de la conversation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la conversation";
      set({ error: errorMessage });
    }
  },

  // Archiver une conversation
  archiveConversationAction: async (conversationId: string) => {
    try {
      await archiveConversation(conversationId);

      // Mettre à jour l'état local
      const { conversations } = get();
      const updatedConversations = conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, status: 'ARCHIVED' as const }
          : conv
      );

      set({ conversations: updatedConversations });
    } catch (error: unknown) {
      console.error("Erreur lors de l'archivage:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'archivage";
      set({ error: errorMessage });
    }
  },

  // Fermer une conversation
  closeConversationAction: async (conversationId: string) => {
    try {
      await closeConversation(conversationId);

      // Mettre à jour l'état local
      const { conversations } = get();
      const updatedConversations = conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, status: 'CLOSED' as const }
          : conv
      );

      set({ conversations: updatedConversations });
    } catch (error: unknown) {
      console.error("Erreur lors de la fermeture:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la fermeture";
      set({ error: errorMessage });
    }
  },

  // Ajouter un nouveau message (pour WebSocket)
  addMessage: (message: Message) => {
    const { messages: currentMessages, conversations } = get();
    const conversationMessages = currentMessages[message.conversationId] || [];
    
    // Éviter les doublons
    const messageExists = conversationMessages.some(m => m.id === message.id);
    if (messageExists) return;
    
    set({
      messages: {
        ...currentMessages,
        [message.conversationId]: [...conversationMessages, message]
      }
    });

    // Mettre à jour la conversation avec le dernier message
    const updatedConversations = conversations.map(conv => 
      conv.id === message.conversationId 
        ? { 
            ...conv, 
            last_message_at: message.created_at,
            unread_count: message.sender_type === 'CLIENT' ? conv.unread_count + 1 : conv.unread_count,
            last_message: {
              id: message.id,
              content: message.content,
              sender_type: message.sender_type,
              message_type: message.message_type,
              created_at: message.created_at
            }
          }
        : conv
    );
    
    set({ conversations: updatedConversations });
  },

  // Mettre à jour une conversation (pour WebSocket)
  updateConversation: (conversation: Conversation) => {
    const { conversations } = get();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      // Mettre à jour une conversation existante
      const updatedConversations = [...conversations];
      updatedConversations[existingIndex] = conversation;
      set({ conversations: updatedConversations });
    } else {
      // Ajouter une nouvelle conversation
      set({ conversations: [conversation, ...conversations] });
    }
  },

  // Effacer l'erreur
  clearError: () => set({ error: null }),

  // Réinitialiser le store
  reset: () =>
    set({
      conversations: [],
      messages: {},
      stats: null,
      isLoading: false,
      error: null,
      isLoadingMessages: false,
      isSendingMessage: false,
      currentPage: 1,
      totalPages: 1,
      hasMorePages: false,
      isLoadingMore: false,
    }),
}));