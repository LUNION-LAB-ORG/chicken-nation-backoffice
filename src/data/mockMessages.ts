import { Conversation, Message } from '@/services/messageService'

// Données de test réalistes pour la Côte d'Ivoire
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    client_id: 'client-1',
    last_message_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    unread_count: 2,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    client: {
      id: 'client-1',
      fullname: 'Kouamé Adjoua',
      email: 'adjoua.kouame@gmail.com',
      phone: '+225 07 12 34 56 78',
      image: '/icons/header/default-avatar.png',
      user_type: 'PREMIUM',
      is_connected: true
    },
    last_message: {
      id: 'msg-1',
      content: 'Bonsoir, ma commande de poulet braisé n\'est toujours pas arrivée...',
      sender_type: 'CLIENT',
      message_type: 'TEXT',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'conv-2',
    client_id: 'client-2',
    last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    unread_count: 0,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    client: {
      id: 'client-2',
      fullname: 'Yao Koffi',
      email: 'koffi.yao@yahoo.fr',
      phone: '+225 05 98 76 54 32',
      image: '/icons/header/default-avatar.png',
      user_type: 'GOLD',
      is_connected: false
    },
    last_message: {
      id: 'msg-2',
      content: 'Merci beaucoup ! Le kedjenou était délicieux 👌',
      sender_type: 'CLIENT',
      message_type: 'TEXT',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'conv-3',
    client_id: 'client-3',
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    unread_count: 1,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    client: {
      id: 'client-3',
      fullname: 'Bamba Fatou',
      email: 'fatou.bamba@orange.ci',
      phone: '+225 01 11 22 33 44',
      image: '/icons/header/default-avatar.png',
      user_type: 'STANDARD',
      is_connected: true
    },
    last_message: {
      id: 'msg-3',
      content: 'Est-ce que vous livrez à Cocody université ce soir ?',
      sender_type: 'CLIENT',
      message_type: 'TEXT',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'conv-4',
    client_id: 'client-4',
    last_message_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    unread_count: 0,
    status: 'CLOSED',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    client: {
      id: 'client-4',
      fullname: 'Traoré Moussa',
      email: 'moussa.traore@gmail.com',
      phone: '+225 09 55 66 77 88',
      image: '/icons/header/default-avatar.png',
      user_type: 'STANDARD',
      is_connected: false
    },
    last_message: {
      id: 'msg-4',
      content: 'Parfait, merci pour le remboursement !',
      sender_type: 'CLIENT',
      message_type: 'TEXT',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'conv-5',
    client_id: 'client-5',
    last_message_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    unread_count: 0,
    status: 'ARCHIVED',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    client: {
      id: 'client-5',
      fullname: 'Ouattara Awa',
      email: 'awa.ouattara@moov.ci',
      phone: '+225 03 99 88 77 66',
      image: '/icons/header/default-avatar.png',
      user_type: 'PREMIUM',
      is_connected: false
    },
    last_message: {
      id: 'msg-5',
      content: 'Merci pour votre fidélité Awa ! À bientôt 😊',
      sender_type: 'BACKOFFICE',
      message_type: 'TEXT',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
]

// Messages réalistes pour la Côte d'Ivoire
export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1-1',
      conversation_id: 'conv-1',
      sender_id: 'client-1',
      sender_type: 'CLIENT',
      content: 'Bonsoir, j\'ai commandé 2 poulets braisés + attiéké il y a 1h30 mais rien n\'est arrivé encore. Commande #CN2024-0156',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: {
        id: 'client-1',
        fullname: 'Kouamé Adjoua',
        email: 'adjoua.kouame@gmail.com',
        image: '/icons/header/default-avatar.png'
      }
    },
    {
      id: 'msg-1-2',
      conversation_id: 'conv-1',
      sender_id: 'backoffice-1',
      sender_type: 'BACKOFFICE',
      content: 'Bonsoir Adjoua ! Je vais vérifier votre commande tout de suite. Je vois la commande #CN2024-0156, elle est en cours de préparation.',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      sender: {
        id: 'backoffice-1',
        fullname: 'Aminata - Support',
        email: 'support@chickennation.ci'
      }
    },
    {
      id: 'msg-1-3',
      conversation_id: 'conv-1',
      sender_id: 'client-1',
      sender_type: 'CLIENT',
      content: 'D\'accord, mais ça fait vraiment longtemps. Normalement c\'est 45 minutes maximum non ?',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      sender: {
        id: 'client-1',
        fullname: 'Kouamé Adjoua',
        email: 'adjoua.kouame@gmail.com',
        image: '/icons/header/default-avatar.png'
      }
    },
    {
      id: 'msg-1-4',
      conversation_id: 'conv-1',
      sender_id: 'backoffice-1',
      sender_type: 'BACKOFFICE',
      content: 'Vous avez raison, je m\'excuse pour ce retard. Il y a eu un petit souci avec notre four, mais votre commande sort de la cuisine maintenant. Le livreur sera chez vous dans 15 minutes maximum !',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      sender: {
        id: 'backoffice-1',
        fullname: 'Aminata - Support',
        email: 'support@chickennation.ci'
      }
    },
    {
      id: 'msg-1-5',
      conversation_id: 'conv-1',
      sender_id: 'client-1',
      sender_type: 'CLIENT',
      content: 'Ah ok merci ! Et pour me faire pardonner ce retard, est-ce que je peux avoir une petite réduction sur ma prochaine commande ? 😊',
      message_type: 'TEXT',
      is_read: false,
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      sender: {
        id: 'client-1',
        fullname: 'Kouamé Adjoua',
        email: 'adjoua.kouame@gmail.com',
        image: '/icons/header/default-avatar.png'
      }
    },
    {
      id: 'msg-1-6',
      conversation_id: 'conv-1',
      sender_id: 'client-1',
      sender_type: 'CLIENT',
      content: 'Je suis une bonne cliente, je commande au moins 2 fois par semaine 😄',
      message_type: 'TEXT',
      is_read: false,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      sender: {
        id: 'client-1',
        fullname: 'Kouamé Adjoua',
        email: 'adjoua.kouame@gmail.com',
        image: '/icons/header/default-avatar.png'
      }
    }
  ],
  'conv-2': [
    {
      id: 'msg-2-1',
      conversation_id: 'conv-2',
      sender_id: 'client-2',
      sender_type: 'CLIENT',
      content: 'Salut ! J\'ai pris le kedjenou de poulet hier soir, c\'était vraiment excellent ! 🔥',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: {
        id: 'client-2',
        fullname: 'Yao Koffi',
        email: 'koffi.yao@yahoo.fr',
        image: '/icons/header/default-avatar.png'
      }
    },
    {
      id: 'msg-2-2',
      conversation_id: 'conv-2',
      sender_id: 'backoffice-1',
      sender_type: 'BACKOFFICE',
      content: 'Merci beaucoup Koffi ! Ça nous fait très plaisir d\'entendre ça 😊 Notre chef sera ravi de savoir que son kedjenou vous a plu !',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      sender: {
        id: 'backoffice-1',
        fullname: 'Ibrahim - Support',
        email: 'support@chickennation.ci'
      }
    },
    {
      id: 'msg-2-3',
      conversation_id: 'conv-2',
      sender_id: 'client-2',
      sender_type: 'CLIENT',
      content: 'Est-ce que vous avez d\'autres plats traditionnels comme ça ? J\'aimerais essayer le garba ou le foutou sauce graine',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      sender: {
        id: 'client-2',
        fullname: 'Yao Koffi',
        email: 'koffi.yao@yahoo.fr',
        image: '/icons/header/default-avatar.png'
      }
    },
    {
      id: 'msg-2-4',
      conversation_id: 'conv-2',
      sender_id: 'backoffice-1',
      sender_type: 'BACKOFFICE',
      content: 'Absolument ! Nous avons le garba disponible tous les matins jusqu\'à 14h, et le foutou sauce graine est au menu le weekend. Je vous envoie notre carte complète !',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      sender: {
        id: 'backoffice-1',
        fullname: 'Ibrahim - Support',
        email: 'support@chickennation.ci'
      }
    },
    {
      id: 'msg-2-5',
      conversation_id: 'conv-2',
      sender_id: 'client-2',
      sender_type: 'CLIENT',
      content: 'Merci beaucoup ! Le kedjenou était délicieux 👌',
      message_type: 'TEXT',
      is_read: true,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sender: {
        id: 'client-2',
        fullname: 'Yao Koffi',
        email: 'koffi.yao@yahoo.fr',
        image: '/icons/header/default-avatar.png'
      }
    }
  ]
}

// Statistiques réalistes pour la Côte d'Ivoire
export const mockStats = {
  total_conversations: 5,
  unread_conversations: 2, // conv-1 et conv-3 ont des messages non lus
  total_messages: 11, // 6 messages conv-1 + 5 messages conv-2
  unread_messages: 3 // 2 messages non lus dans conv-1 + 1 dans conv-3
}
