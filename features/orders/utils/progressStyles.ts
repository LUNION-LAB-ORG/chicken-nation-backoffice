import { OrderTable } from "../types/ordersTable.types";
import { differenceInMinutes, isSameDay, format } from "date-fns";

/* =====================================================
   DESIGN TOKENS
===================================================== */
const UI = {
    bg: {
        active: "bg-[#F17922]",
        inactive: "bg-white",
        lineActive: "bg-[#F17922]",
        lineInactive: "bg-[#FFE8D7]",
        danger: "bg-[#FF3B30]",
    },
    border: {
        active: "border-[#F17922]",
        inactive: "border-[#F17922]",
        danger: "border-[#FF3B30]",
    },
};

const ICONS = [
    {
        default: "/icons/poulet.png",
        active: "/icons/poulet-blanc.png",
    },
    {
        default: "/icons/package_orange.png",
        active: "/icons/package.png",
    },
    {
        default: "/icons/location-outline.png",
        active: "/icons/location_white.png",
    },
];

/* =====================================================
   TYPES
===================================================== */

type ProgressStep = {
    title: string;
    date?: string;
    icon: string;
    isActive: boolean;
    duration?: string;
};

/* =====================================================
   HELPERS
===================================================== */

/**
 * Formate la date selon le contexte
 * - Si même jour que la création : affiche uniquement l'heure
 * - Sinon : affiche date + heure
 */
const formatStepDate = (dateStr: string, createdAt: string): string => {
    const date = new Date(dateStr);
    const creationDate = new Date(createdAt);

    if (isSameDay(date, creationDate)) {
        return format(date, "HH:mm");
    }
    return format(date, "dd/MM/yyyy HH:mm");
};

/**
 * Calcule la durée entre deux dates
 * Retourne un format lisible (ex: "15 min", "1h 30min")
 */
const calculateDuration = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const minutes = differenceInMinutes(end, start);

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`;
};

/* =====================================================
   LOGIQUE PRINCIPALE
===================================================== */

const buildSteps = (order: OrderTable): ProgressStep[] => {
    // ❌ Cas spécial : Commande annulée
    if (order.status === "ANNULÉE") {
        return [
            {
                title: "Commande annulée",
                icon: ICONS[0].active,
                isActive: true,
            },
            {
                title: "Prête",
                icon: ICONS[1].default,
                isActive: false,
            },
            {
                title: "En livraison",
                icon: ICONS[2].default,
                isActive: false,
            },
            {
                title: "Récupérée",
                icon: ICONS[2].default,
                isActive: false,
            },
        ];
    }

    const steps: ProgressStep[] = [];

    // ========== STEP 1 : CRÉATION ==========
    steps.push({
        title: "Création",
        date: formatStepDate(order.createdAt, order.createdAt),
        icon: ICONS[0].active,
        isActive: true,
        duration: order.readyAt
            ? calculateDuration(order.createdAt, order.readyAt)
            : undefined,
    });

    // ========== STEP 2 : PRÊTE ==========
    const isReady = !!order.readyAt;
    steps.push({
        title: "Prête",
        date: order.readyAt
            ? formatStepDate(order.readyAt, order.createdAt)
            : undefined,
        icon: isReady ? ICONS[1].active : ICONS[1].default,
        isActive: isReady,
        duration:
            order.readyAt && order.pickedUpAt
                ? calculateDuration(order.readyAt, order.pickedUpAt)
                : undefined,
    });

    // ========== STEP 3 : EN LIVRAISON (= PICKED_UP, livreur a pris) ==========
    const isPickedUp = !!order.pickedUpAt;
    steps.push({
        title: "En livraison",
        date: order.pickedUpAt
            ? formatStepDate(order.pickedUpAt, order.createdAt)
            : undefined,
        icon: isPickedUp ? ICONS[2].active : ICONS[2].default,
        isActive: isPickedUp,
        duration:
            order.pickedUpAt && order.collectedAt
                ? calculateDuration(order.pickedUpAt, order.collectedAt)
                : undefined,
    });

    // ========== STEP 4 : RÉCUPÉRÉE (= COLLECTED, client a reçu) ==========
    const isCollected = !!order.collectedAt;
    steps.push({
        title: "Récupérée",
        date: order.collectedAt
            ? formatStepDate(order.collectedAt, order.createdAt)
            : undefined,
        icon: isCollected ? ICONS[2].active : ICONS[2].default,
        isActive: isCollected,
    });

    return steps;
};

export { buildSteps, UI, ICONS };