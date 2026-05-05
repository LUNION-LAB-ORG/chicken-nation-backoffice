import { differenceInMinutes, differenceInSeconds } from "date-fns";

import { OrderStatus, type Order } from "../../orders/types/order.types";

export type UrgencyLevel = "safe" | "warn" | "danger";

/**
 * Formate un nombre de secondes écoulées en chaîne courte.
 * Convention : seule la **plus grande** unité porte sa lettre ; l'unité immédiatement
 * inférieure s'écrit en nombre nu. On omet les unités encore plus fines.
 *
 *   < 1 min  → "30", "59"            (secondes seules, pas de suffixe)
 *   < 1 h    → "1m", "1m3", "45m"    (minutes + reste en secondes)
 *   < 1 j    → "1h", "1h20"          (heures + reste en minutes)
 *   ≥ 1 j    → "1j", "1j5", "7j23"   (jours + reste en heures)
 */
export function formatElapsed(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0";
  const s = Math.floor(totalSeconds) % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const h = totalHours % 24;
  const d = Math.floor(totalHours / 24);
  if (d > 0) return h === 0 ? `${d}j` : `${d}j${h}`;
  if (totalHours > 0) return m === 0 ? `${totalHours}h` : `${totalHours}h${m}`;
  if (totalMinutes > 0) return s === 0 ? `${totalMinutes}m` : `${totalMinutes}m${s}`;
  return `${s}`;
}

/** Timestamp de référence (ISO) pour le compteur d'urgence de la card. Exposé pour les hooks. */
export function getReferenceAtISO(order: Order): string | null {
  const ref = getReferenceAt(order);
  return ref ? ref.toISOString() : null;
}

/** Secondes écoulées depuis le timestamp pertinent du statut (ou null si inconnu). */
export function getElapsedSeconds(order: Order): number | null {
  const refAt = getReferenceAt(order);
  if (!refAt) return null;
  return Math.max(0, differenceInSeconds(new Date(), refAt));
}

/**
 * Détermine le niveau d'urgence visuel d'une commande selon son temps d'attente
 * dans son statut courant.
 *
 * Seuils (min) :
 *   ACCEPTED / IN_PROGRESS : < 5 safe · 5-12 warn · > 12 danger
 *   READY                  : < 8 safe · 8-20 warn · > 20 danger
 *   PICKED_UP / COLLECTED  : < 30 safe · 30-60 warn · > 60 danger (cash non encaissée longtemps)
 */
export function getUrgencyLevel(order: Order): UrgencyLevel {
  const now = new Date();
  const refAt = getReferenceAt(order);
  if (!refAt) return "safe";
  const mins = differenceInMinutes(now, refAt);
  const thresholds = getThresholds(order.status);
  if (mins < thresholds.warn) return "safe";
  if (mins < thresholds.danger) return "warn";
  return "danger";
}

/** Progrès (0-100) pour le ring du card — fonction inverse de l'urgence. */
export function getUrgencyProgress(order: Order): number {
  const now = new Date();
  const refAt = getReferenceAt(order);
  if (!refAt) return 0;
  const mins = differenceInMinutes(now, refAt);
  const thresholds = getThresholds(order.status);
  const pct = (mins / thresholds.danger) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Minutes écoulées depuis le timestamp pertinent du statut. */
export function getElapsedMinutes(order: Order): number | null {
  const refAt = getReferenceAt(order);
  if (!refAt) return null;
  return differenceInMinutes(new Date(), refAt);
}

function getReferenceAt(order: Order): Date | null {
  const pick = (s: string | null | undefined) => (s ? new Date(s) : null);
  switch (order.status) {
    case OrderStatus.ACCEPTED:
      return pick(order.accepted_at) ?? pick(order.created_at);
    case OrderStatus.IN_PROGRESS:
      return pick(order.prepared_at) ?? pick(order.accepted_at);
    case OrderStatus.READY:
      return pick(order.ready_at);
    case OrderStatus.PICKED_UP:
      return pick(order.picked_up_at);
    case OrderStatus.COLLECTED:
      return pick(order.collected_at);
    case OrderStatus.COMPLETED:
      return pick(order.completed_at);
    default:
      return pick(order.created_at);
  }
}

function getThresholds(status: OrderStatus): { warn: number; danger: number } {
  switch (status) {
    case OrderStatus.ACCEPTED:
    case OrderStatus.IN_PROGRESS:
      return { warn: 5, danger: 12 };
    case OrderStatus.READY:
      return { warn: 8, danger: 20 };
    case OrderStatus.PICKED_UP:
    case OrderStatus.COLLECTED:
    case OrderStatus.COMPLETED:
      return { warn: 30, danger: 60 };
    default:
      return { warn: 10, danger: 30 };
  }
}

export const URGENCY_COLORS: Record<UrgencyLevel, { ring: string; bg: string; text: string; border: string }> = {
  safe: { ring: "#4FCB71", bg: "bg-green-50", text: "text-green-700", border: "border-green-300" },
  warn: { ring: "#F5A524", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" },
  danger: { ring: "#EF4444", bg: "bg-red-50", text: "text-red-700", border: "border-red-400" },
};
