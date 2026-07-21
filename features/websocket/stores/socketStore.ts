import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import NotificationAPI from '@/services/notificationService';
import { SOCKET_URL } from '@/config';

interface SocketState {
  socket: Socket | null;
  connected: boolean;

  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connect: () => {
    const { socket } = get();

    // 🔒 Un socket existe (connecté OU en cours de connexion) → on ne fait RIEN.
    // (Tester `connected` créait une course : deux modules appelant connect()
    // au montage, avant l'événement 'connect', créaient DEUX sockets — le 1er,
    // remplacé dans le store mais jamais fermé, gardait des listeners orphelins
    // et des événements se perdaient. La reconnexion est gérée par socket.io.)
    if (socket) return;

    const newSocket = io(SOCKET_URL, {
      query: {
        token: NotificationAPI.getToken(),
        type: 'user',
      },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      set({ connected: true });
      console.log('🟢 Socket connecté');
    });

    newSocket.on('disconnect', () => {
      set({ connected: false });
      console.log('🔴 Socket déconnecté');
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },
}));
