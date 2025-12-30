import { OrderTable } from "../types/ordersTable.types";
import { ORDER_SLA, OrderTimer } from "./orderSla.config";

export const computeOrderTimer = (
    order: OrderTable
): OrderTimer | null => {
    const rule = ORDER_SLA[order.status];
    if (!rule) return null;

    const now = Date.now();
    const statusStart = new Date(order.updatedAt).getTime();

    const elapsedSeconds = Math.floor(
        (now - statusStart) / 1000
    );

    const delayMinutes =
        typeof rule.delayMinutes === "function"
            ? rule.delayMinutes(order)
            : rule.delayMinutes;

    const allowedSeconds = delayMinutes * 60;

    return {
        orderId: order.id,
        status: order.status,
        elapsedSeconds,
        allowedSeconds,
        isOverdue: elapsedSeconds >= allowedSeconds,
    };
};
