import { useEffect, useMemo } from "react";
import { useNotificationStateStore } from "../../websocket/stores/notificationState.store";
import { mapApiOrdersToUiOrders } from "../utils/orderMapper";
import { useOrderListQuery } from "../queries/order-list.query";
import { ACTIVE_ORDER_STATUSES } from "../constantes/activeOrderStatuses";
import { useAuthStore } from "../../users/hook/authStore";

export const useActiveOrders = () => {
  const { user } = useAuthStore();
  const setActiveOrders =
    useNotificationStateStore(s => s.setActiveOrders);

  const queries = ACTIVE_ORDER_STATUSES.map(status =>
    useOrderListQuery({
      status, restaurantId:
        user && user.type == "BACKOFFICE" ?
          undefined :
          user?.restaurant_id
    })
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
