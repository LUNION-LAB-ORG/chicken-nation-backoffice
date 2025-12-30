import { create } from "zustand";
import { OrderTimer } from "../../orders/sla/orderSla.config";
import { OrderTable } from "../../orders/types/ordersTable.types";

export interface NotificationState {
    // ======================
    // COMMANDES
    // ======================

    /** Toutes les commandes actives (SLA source de vérité) */
    activeOrders: OrderTable[];

    /** Commandes en retard (calcul SLA) */
    overdueOrders: OrderTable[];

    /** Timers SLA */
    orderTimers: OrderTimer[];

    // ======================
    // MESSAGES / NOTIFS
    // ======================

    unreadMessages: any[];
    unreadNotifications: any[];

    // ======================
    // SETTERS
    // ======================

    setActiveOrders: (orders: OrderTable[]) => void;
    setOverdueOrders: (orders: OrderTable[]) => void;
    setOrderTimers: (timers: OrderTimer[]) => void;

    setUnreadMessages: (messages: any[]) => void;
    setUnreadNotifications: (notifications: any[]) => void;

    // ======================
    // HELPERS
    // ======================

    recomputeDerivedOrders: () => void;
}


export const useNotificationStateStore =
    create<NotificationState>((set, get) => ({
        // ======================
        // STATE
        // ======================

        activeOrders: [],
        overdueOrders: [],
        orderTimers: [],

        unreadMessages: [],
        unreadNotifications: [],

        // ======================
        // SETTERS
        // ======================

        setActiveOrders: (orders) => {
            set({ activeOrders: orders });
            get().recomputeDerivedOrders();
        },

        setOverdueOrders: (orders) =>
            set({ overdueOrders: orders }),

        setOrderTimers: (timers) => {
            set({ orderTimers: timers });
            get().recomputeDerivedOrders();
        },


        setUnreadMessages: (messages) =>
            set({ unreadMessages: messages }),

        setUnreadNotifications: (notifications) =>
            set({ unreadNotifications: notifications }),

        // ======================
        // DERIVED LOGIC
        // ======================

        recomputeDerivedOrders: () => {
            const { activeOrders, orderTimers } = get();

            const overdueOrders = activeOrders.filter(order =>
                orderTimers.some(
                    t => t.orderId === order.id && t.isOverdue
                )
            );

            set({
                overdueOrders,
            });
        },
    }));
