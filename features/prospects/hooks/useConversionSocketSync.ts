import { useEffect } from "react";
import { useSocket } from "../../websocket/hooks/useSocket";
import { useInvalidateConversionQuery } from "../queries/index.query";

/** Événement émis par le backend à chaque changement d'un prospect. */
const EVENEMENT = "conversion:prospect-updated";

/**
 * Temps réel du module (cahier §3) : quand un client commande, sa ligne
 * disparaît aussitôt de l'écran de l'agent, qui ne l'appelle pas pour rien.
 * Les statistiques, plus lourdes, attendent leur propre rafraîchissement.
 */
export const useConversionSocketSync = () => {
  const socket = useSocket();
  const invalider = useInvalidateConversionQuery();

  useEffect(() => {
    if (!socket) return;
    const surChangement = () => {
      invalider("prospects");
      invalider("ma-file");
      invalider("fiche");
    };
    socket.on(EVENEMENT, surChangement);
    return () => {
      socket.off(EVENEMENT, surChangement);
    };
  }, [socket, invalider]);
};
