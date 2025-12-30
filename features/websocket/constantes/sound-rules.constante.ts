import { SoundContext } from "../hooks/useSoundContext";
import { NotificationState } from "../stores/notificationState.store";

export type SoundMode = 'once' | 'repeat';

export type SOUND_CHANNELS = "PENDING_ORDERS_CHANNEL" | "OVERDUE_ORDERS_CHANNEL" | 'NEW_NOTIFICATION_CHANNEL' | "PAYMENT_FAILED_CHANEL";
export interface SoundRulesConfig {
    id: string;
    src: string;
    mode: 'once' | 'repeat';
    interval?: number;
    condition: (
        state: NotificationState,
        ctx: SoundContext
    ) => boolean;
}

export const SOUND_RULES: SoundRulesConfig[] = [
    {
        id: "ACTIVES_ORDERS_CHANNEL",
        src: '/musics/pending-order.mp3',
        mode: 'repeat',
        interval: 3000,
        condition: (s: NotificationState, ctx: SoundContext) => {
            if (!ctx.user) return false;

            if (s.activeOrders) {
                const pendingOrders = s.activeOrders.find(active => active.status == "NOUVELLE"); // nouvelle commande
                if (pendingOrders && ctx.user.type == "RESTAURANT" && ["CAISSIER", "MANAGER", "ASSISTANT_MANAGER"].includes(ctx.user.role)) return true;
                return false;
            }

            return false;
        },
    },
    {
        id: "OVERDUE_ORDERS_CHANNEL",
        src: '/musics/ding-dong.mp3',
        mode: 'repeat',
        interval: 5000,
        condition: (s: NotificationState, ctx: SoundContext) => {
            if (!ctx.user) return false;
            if (s.overdueOrders.length > 0) {
                if (ctx.user.type == "BACKOFFICE" && ["CALL_CENTER"].includes(ctx.user.role)) return true;
                return false;
            }

            return false
        },
    },

    {
        id: "NEW_NOTIFICATION_CHANNEL",
        src: '/musics/notification.mp3',
        mode: 'once',
        condition: (s: NotificationState, ctx: SoundContext) => s.unreadMessages.length > 0,
    },

    {
        id: "PAYMENT_FAILED_CHANEL",
        src: '/musics/error.mp3',
        mode: 'repeat',
        interval: 2000,
        condition: (s: NotificationState, ctx: SoundContext) => s.unreadNotifications.some(
            n => n.type === 'PAYMENT_FAILED'
        ),
    }
] as const;