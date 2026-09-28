import { useEffect, useMemo } from "react";
import { useNotificationStateStore } from "../../websocket/stores/notificationState.store";
import { mapApiOrdersToUiOrders } from "../utils/orderMapper";
import { useOrderListQuery } from "../queries/order-list.query";
import { ACTIVE_ORDER_STATUSES } from "../constantes/activeOrderStatuses";
import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";

export const useActiveOrders = () => {
  const { user } = useAuthStore();
  // Monté sur toutes les pages : un compte qui ne lit pas les commandes (le
  // Marketing) recevrait un refus par statut, à chaque page et à chaque
  // événement de commande. Sans ce droit, rien n'est demandé.
  const peutLireCommandes = useAuthStore((s) => s.can(Modules.COMMANDES, Action.READ));
  const setActiveOrders =
    useNotificationStateStore(s => s.setActiveOrders);

  const queries = ACTIVE_ORDER_STATUSES.map(status =>
    useOrderListQuery({
      status, restaurantId:
        user && user.type == "BACKOFFICE" ?
          undefined :
          user?.restaurant_id
    }, peutLireCommandes)
  );

  const orders = useMemo(() => {
    const map = new Map<string, any>();

    queries.forEach(q => {
      q.data?.data?.forEach(order => {
        map.set(order.id, order);
      });
    });

    return mapApiOrdersToUiOrders([...map.values()]);
  }, queries.map(q => q.data));

  useEffect(() => {
    setActiveOrders(orders);
  }, [orders]);

  return {
    activeOrders: orders,
    activeCount: orders.length,
  };
};
