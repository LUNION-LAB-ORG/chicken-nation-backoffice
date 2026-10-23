import { useEffect } from "react";
import { useSocket } from "../../websocket/hooks/useSocket";
import { useInvalidateOrderQuery } from "../queries/index.query";
import { orderEventsWebsocket } from "../constantes/orderEventsWebsocket";
import { relectureDeConfirmation } from "../../operations/utils/synchro-operations";

/**
 * Liste des commandes à jour en direct. Chaque événement relit tout de suite,
 * puis une relecture de confirmation suit la rafale : les lectures GET
 * /orders/* passent par le cache d'une seconde du serveur, et une relecture
 * faite pendant la rafale peut recevoir la réponse d'avant le dernier
 * événement (banc du 23/10, voir `synchro-operations.ts`).
 */
export const useOrdersSocketSync = () => {
  const socket = useSocket();
  const invalidateOrders = useInvalidateOrderQuery();

  useEffect(() => {
    if (!socket) return;

    const confirmation = relectureDeConfirmation(() => void invalidateOrders());
    const surEvenement = () => {
      void invalidateOrders();
      confirmation.signaler();
    };

    orderEventsWebsocket.forEach(event =>
      socket.on(event, surEvenement)
    );

    return () => {
      orderEventsWebsocket.forEach(event =>
        socket.off(event, surEvenement)
      );
      confirmation.arreter();
    };
  }, [socket, invalidateOrders]);
};
