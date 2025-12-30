import { useMessagesSound } from '@/hooks/useMessagesSound';
import { useEffect } from 'react';
import { notificationSoundEngine } from '../engine/NotificationSoundEngine';
import { useSoundContext } from './useSoundContext';
import { useOrdersSocketSync } from '../../orders/hooks/useOrdersSocketSync';
import { useActiveOrders } from '../../orders/hooks/useActiveOrders';
import { useOrdersSlaWatcher } from '../../orders/hooks/useOrdersSlaWatcher';

export const useNotificationBootstrap = () => {
  useOrdersSocketSync();   // 📡 socket
  useActiveOrders();       // 🔄 API
  useOrdersSlaWatcher();   // ⏱️ SLA
  useMessagesSound();

  // Chargement du contexte pour déclencher le son
  const ctx = useSoundContext();

  useEffect(() => {
    // Mise à jour du contexte pour déclencher le son
    notificationSoundEngine.setContextProvider(() => ctx);
    // Démarrage du son
    notificationSoundEngine.start();
  }, [ctx]);
};
