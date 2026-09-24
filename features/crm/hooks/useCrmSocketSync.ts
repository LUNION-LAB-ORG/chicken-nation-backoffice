import { useEffect } from "react";
import { useSocket } from "../../websocket/hooks/useSocket";
import { useInvalidateCrmQuery } from "../queries/index.query";

/** Événement émis par le backend à chaque changement d'un contact. */
const EVENEMENT = "crm:contact-updated";

/**
 * Temps réel du module (cahier §3) : quand un client commande, sa ligne
 * disparaît aussitôt de l'écran de l'agent, qui ne l'appelle pas pour rien.
 * Les statistiques, plus lourdes, attendent leur propre rafraîchissement.
 */
export const useCrmSocketSync = () => {
  const socket = useSocket();
  const invalider = useInvalidateCrmQuery();

  useEffect(() => {
    if (!socket) return;
    const surChangement = () => {
      invalider("contacts");
      invalider("ma-file");
      invalider("fiche");
    };
    socket.on(EVENEMENT, surChangement);
    return () => {
      socket.off(EVENEMENT, surChangement);
    };
  }, [socket, invalider]);
};
