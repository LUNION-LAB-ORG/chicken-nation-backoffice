import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../../src/config';
import { NotificationAPI } from '../../../src/services/notificationService';

/**
 * Socket UNIQUE du backoffice, partagé par comptage de références.
 *
 * Avant : chaque hook (liste de conversations, conversation ouverte, tickets,
 * notifications) ouvrait SA connexion io(). Résultat mesuré par l'audit :
 * jusqu'à trois connexions en parallèle, le son de notification joué deux ou
 * trois fois par message, des invalidations en rafale, et une fuite dans le
 * hook notifications qui ne se déconnectait jamais.
 *
 * Chaque consommateur fait acquire() au montage, pose SES handlers avec
 * socket.on, les retire avec socket.off(event, handler) au démontage, puis
 * release(). La connexion se ferme quand plus personne ne l'utilise.
 */

let socket: Socket | null = null;
let refCount = 0;

export function acquireSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = NotificationAPI.getToken();
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      query: { token, type: 'user' },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }
  refCount++;
  return socket;
}

export function releaseSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Garde anti-doublon du son : plusieurs vues écoutent le même événement,
 * mais un message donné ne doit sonner qu'une fois.
 */
const playedIds = new Set<string>();
export function shouldPlayOnce(id: string | undefined | null): boolean {
  if (!id) return true;
  if (playedIds.has(id)) return false;
  playedIds.add(id);
  if (playedIds.size > 500) {
    const oldest = playedIds.values().next().value;
    if (oldest) playedIds.delete(oldest);
  }
  return true;
}
