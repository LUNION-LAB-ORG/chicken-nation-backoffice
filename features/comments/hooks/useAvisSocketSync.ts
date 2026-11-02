import { useEffect } from "react";
import { acquireSocket, releaseSocket } from "../../messagerie/hooks/sharedSocket";
import { useInvaliderAvis } from "../queries/avis-prive.query";
import { cibleNotificationAvis } from "../utils/avis-prive";

/**
 * Temps réel des retours privés : la cloche d'un avis (« Client pas content »,
 * « Avis en retard ») relit aussitôt la liste, les compteurs et la fiche. Les
 * autres comptes (sans cloche) suivent le rafraîchissement d'une minute.
 * Socket partagé du back-office, celui de la cloche.
 */
export const useAvisSocketSync = () => {
  const invalider = useInvaliderAvis();

  useEffect(() => {
    const socket = acquireSocket();
    if (!socket) return;
    const surNotification = (notification?: { data?: unknown } | null) => {
      if (cibleNotificationAvis(notification?.data)) invalider();
    };
    socket.on("notification:new", surNotification);
    return () => {
      socket.off("notification:new", surNotification);
      releaseSocket();
    };
  }, [invalider]);
};
