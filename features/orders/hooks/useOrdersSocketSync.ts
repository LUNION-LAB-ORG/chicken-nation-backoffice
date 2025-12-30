import { useEffect } from "react";
import { useSocket } from "../../websocket/hooks/useSocket";
import { useInvalidateOrderQuery } from "../queries/index.query";
import { orderEventsWebsocket } from "../constantes/orderEventsWebsocket";

export const useOrdersSocketSync = () => {
  const socket = useSocket();
  const invalidateOrders = useInvalidateOrderQuery();

  useEffect(() => {
    if (!socket) return;


    orderEventsWebsocket.forEach(event =>
      socket.on(event, invalidateOrders)
    );

    return () => {
      orderEventsWebsocket.forEach(event =>
        socket.off(event, invalidateOrders)
      );
    };
  }, [socket, invalidateOrders]);
};
