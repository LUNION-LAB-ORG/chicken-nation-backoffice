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
    const { socket, connected } = get();

    // 🔒 Déjà connecté → on ne fait RIEN
    if (socket && connected) return;

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
