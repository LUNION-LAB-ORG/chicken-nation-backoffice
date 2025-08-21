import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../socket';
import { getOrders } from '@/services/orderService';

interface UsePendingOrdersSoundParams {
  activeFilter: string;
  selectedRestaurant?: string;
  enabled: boolean; // Pour permettre d'activer/désactiver le son
}

export const usePendingOrdersSound = ({ 
  activeFilter, 
  selectedRestaurant, 
  enabled 
}: UsePendingOrdersSoundParams) => {
  const { user } = useAuthStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPendingOrders, setHasPendingOrders] = useState(false);

  // ✅ Vérifier si l'utilisateur peut entendre les sons (exclure ADMIN et MARKETING)
  const canPlaySound = user && !['ADMIN', 'MARKETING'].includes(user.role?.toUpperCase());

  // ✅ Vérifier les commandes PENDING existantes au démarrage
  useEffect(() => {
    if (!enabled || !canPlaySound) return;

    const checkExistingPendingOrders = async () => {
      try {
        const response = await getOrders({
          status: 'PENDING',
          restaurantId: selectedRestaurant || undefined,
          limit: 1 // On a juste besoin de savoir s'il y en a
        });
        
        if (response.data.length > 0) {
          console.log(`[usePendingOrdersSound] ${response.data.length} commande(s) PENDING détectée(s)`);
          setHasPendingOrders(true);
        }
      } catch (error) {
        console.error('[usePendingOrdersSound] Erreur lors de la vérification des commandes PENDING:', error);
      }
    };

    checkExistingPendingOrders();
  }, [enabled, canPlaySound, selectedRestaurant]);

  // ✅ WebSocket pour écouter les nouvelles commandes PENDING
  useEffect(() => {
    if (!enabled || !canPlaySound) return;

    socketRef.current = io(SOCKET_URL);
    
    const handleNewPendingOrder = (orderData: any) => {
      console.log('[WebSocket] Nouvelle commande PENDING reçue:', orderData);
      
      // Vérifier si c'est une commande PENDING
      if (orderData?.status === 'PENDING') {
        // Filtrer par restaurant si nécessaire
        if (selectedRestaurant && orderData.restaurant_id !== selectedRestaurant) {
          return;
        }
        
        setHasPendingOrders(true);
      }
    };

    const handleOrderStatusChange = async (orderData: any) => {
      console.log('[WebSocket] Changement de statut de commande:', orderData);
      
      // Si une commande PENDING change de statut, vérifier s'il en reste
      if (orderData?.oldStatus === 'PENDING' && orderData?.newStatus !== 'PENDING') {
        try {
          const response = await getOrders({
            status: 'PENDING',
            restaurantId: selectedRestaurant || undefined,
            limit: 1
          });
          
          if (response.data.length === 0) {
            console.log('[WebSocket] Plus de commandes PENDING - arrêt du son');
            setHasPendingOrders(false);
          }
        } catch (error) {
          console.error('[WebSocket] Erreur lors de la vérification des commandes PENDING restantes:', error);
          // En cas d'erreur, on arrête le son par précaution
          setHasPendingOrders(false);
        }
      }
    };

    // Écouter les événements
    socketRef.current.on('order:new', handleNewPendingOrder);
    socketRef.current.on('order:status_changed', handleOrderStatusChange);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('order:new', handleNewPendingOrder);
        socketRef.current.off('order:status_changed', handleOrderStatusChange);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled, canPlaySound, selectedRestaurant]);

  // Initialiser l'audio
  useEffect(() => {
    if (enabled && canPlaySound) {
      audioRef.current = new Audio("/musics/pending-order.mp3");
      audioRef.current.load();
      audioRef.current.loop = false; // On gérera la boucle manuellement
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, canPlaySound]);

  // Fonction pour jouer le son en continu
  const startContinuousSound = () => {
    if (!audioRef.current || !enabled || !canPlaySound || isPlaying) return;

    setIsPlaying(true);
    
    const playSound = () => {
      if (audioRef.current && enabled && canPlaySound) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.error("Erreur de lecture audio pour commandes en attente", error);
        });
      }
    };

    // Jouer immédiatement
    playSound();

    // Puis répéter toutes les 3 secondes
    intervalRef.current = setInterval(playSound, 3000);
  };

  // Fonction pour arrêter le son
  const stopContinuousSound = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  // ✅ Jouer le son quand il y a des commandes PENDING (basé sur WebSocket)
  useEffect(() => {
    if (!enabled || !canPlaySound) return;

    if (hasPendingOrders && !isPlaying) {
      // Il y a des commandes en attente et le son ne joue pas -> démarrer
      startContinuousSound();
    } else if (!hasPendingOrders && isPlaying) {
      // Plus de commandes en attente et le son joue -> arrêter
      stopContinuousSound();
    }
  }, [hasPendingOrders, isPlaying, enabled, canPlaySound]);

  // Cleanup global
  useEffect(() => {
    return () => {
      stopContinuousSound();
    };
  }, []);

  return {
    hasPendingOrders,
    isPlaying,
    pendingOrdersCount: hasPendingOrders ? 1 : 0,  
    startSound: startContinuousSound,
    stopSound: stopContinuousSound
  };
};