import { useEffect } from "react";
import { useNotificationStateStore } from "../../websocket/stores/notificationState.store";
import { computeOrderTimer } from "../sla/computeOrderTimer";

export const useOrdersSlaWatcher = () => {
    const activeOrders =
        useNotificationStateStore(s => s.activeOrders);

    const {
        setOrderTimers,
        recomputeDerivedOrders,
    } = useNotificationStateStore.getState();

    useEffect(() => {
        if (!activeOrders.length) {
            setOrderTimers([]);
            recomputeDerivedOrders();
            return;
        }

        const update = () => {
            const timers = activeOrders
                .map(computeOrderTimer)
                .filter(Boolean);

            setOrderTimers(timers as any);
            recomputeDerivedOrders();
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [activeOrders]);
};
