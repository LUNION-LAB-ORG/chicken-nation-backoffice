import { useEffect } from "react";
import { acquireSocket, releaseSocket } from "../../messagerie/hooks/sharedSocket";
import { useInvaliderIncidents } from "../queries/incident.query";
import { cibleNotificationIncident } from "../utils/incident";

/** Émis par le serveur à chaque création ou changement d'un incident. */
const EVENEMENT = "incident:changed";

/**
 * Temps réel des incidents : un incident signalé, pris, résolu ou clôturé par
 * un collègue relit aussitôt le tableau, les compteurs, la fiche ouverte et
 * les étiquettes des commandes. La cloche d'un incident fait de même. Socket
 * partagé du back-office, celui de la cloche.
 */
export const useIncidentsSocketSync = (actif = true) => {
  const invalider = useInvaliderIncidents();

  useEffect(() => {
    if (!actif) return;
    const socket = acquireSocket();
    if (!socket) return;
    const surChangement = () => invalider();
    const surNotification = (notification?: { data?: unknown } | null) => {
      if (cibleNotificationIncident(notification?.data)) invalider();
    };
    socket.on(EVENEMENT, surChangement);
    socket.on("notification:new", surNotification);
    return () => {
      socket.off(EVENEMENT, surChangement);
      socket.off("notification:new", surNotification);
      releaseSocket();
    };
  }, [actif, invalider]);
};
