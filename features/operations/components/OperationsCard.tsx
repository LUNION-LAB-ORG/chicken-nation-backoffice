"use client";

import React from "react";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  User,
  Wallet,
  Zap,
} from "lucide-react";

import { PaymentMethod, type Order } from "../../orders/types/order.types";
import { OrderStatus, OrderType } from "../../orders/types/order.types";
import { useTickingElapsed } from "../hooks/use-ticking-elapsed";
import {
  formatElapsed,
  getReferenceAtISO,
  getUrgencyLevel,
  getUrgencyProgress,
  URGENCY_COLORS,
} from "../utils/card-urgency";
import { getStatusBadgeClasses, getTypeMeta } from "../utils/status-colors";

interface Props {
  order: Order;
  onClick: () => void;
  /** Callback pour le bouton "Faire le paiement" en bas de la card (ouvre le drawer au tab Paiement) */
  onPayClick?: () => void;
  showWarningBadge?: boolean;
  warningLabel?: string;
  /** Cache le ring d'urgence pour les cards groupées dans une course */
  hideUrgencyRing?: boolean;
}

const PAYABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PICKED_UP,
  OrderStatus.COLLECTED,
  OrderStatus.COMPLETED,
];

/**
 * Libellés alignés sur le mapper `orderMapper.ts` de la page Commandes —
 * aucune divergence tolérée : on affiche partout exactement ce que la page
 * Commandes affiche pour un statut donné.
 */
const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "EN ATTENTE",
  ACCEPTED: "NOUVELLE",
  IN_PROGRESS: "EN PRÉPARATION",
  READY: "PRÊT",
  PICKED_UP: "EN LIVRAISON",
  COLLECTED: "RÉCUPÉRÉE",
  COMPLETED: "TERMINÉE",
  CANCELLED: "ANNULÉE",
};


function formatPrix(n: number): string {
  return n.toLocaleString("fr-FR").replace(/\s/g, ".") + " F";
}

function getClientName(order: Order): string {
  const full = [order.customer?.first_name, order.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || order.fullname || "Client";
}

function getAddressShort(order: Order): string {
  try {
    const addr = typeof order.address === "string" ? JSON.parse(order.address) : order.address;
    return (addr as { address?: string }).address ?? "—";
  } catch {
    return typeof order.address === "string" ? order.address : "—";
  }
}

/** Card commande enrichie avec progress ring d'urgence et badges contextuels. */
export const OperationsCard: React.FC<Props> = ({
  order,
  onClick,
  onPayClick,
  showWarningBadge,
  warningLabel,
  hideUrgencyRing = false,
}) => {
  const urgency = getUrgencyLevel(order);
  const progress = getUrgencyProgress(order);
  const refAtISO = getReferenceAtISO(order);
  const elapsedSec = useTickingElapsed(refAtISO);
  const elapsedLabel = elapsedSec !== null ? formatElapsed(elapsedSec) : null;
  const colors = URGENCY_COLORS[urgency];
  const typeMeta = getTypeMeta(order.type);
  const statusBadgeCls = getStatusBadgeClasses(order.status);

  return (
    <button
      onClick={onClick}
      className={`group w-full bg-white rounded-2xl border text-left p-3 transition-all hover:shadow-md ${
        urgency === "danger"
          ? "border-red-300 shadow-red-100"
          : urgency === "warn"
            ? "border-amber-200"
            : "border-gray-200 hover:border-[#F17922]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Ring d'urgence */}
        {!hideUrgencyRing && (
          <div className="shrink-0">
            <UrgencyRing progress={progress} color={colors.ring} label={elapsedLabel} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Ligne 1 — header : ref + prix */}
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <span className="text-sm font-bold text-gray-900 truncate">{order.reference}</span>
            <span className="text-sm font-bold text-[#F17922] tabular-nums shrink-0">
              {formatPrix(order.amount)}
            </span>
          </div>

          {/* Ligne 2 — rangée unique de badges : statut · type · source · warning */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {/* Statut (border-2, en évidence) — couleurs alignées sur la page Commandes */}
            <span
              className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border-2 ${statusBadgeCls}`}
            >
              {STATUS_LABELS[order.status] ?? "—"}
            </span>
            {/* Type (border, en évidence) */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border ${typeMeta.cls}`}
            >
              <typeMeta.Icon className="w-3 h-3" />
              {typeMeta.label}
            </span>
            {/* Source */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border ${
                order.auto
                  ? "bg-slate-50 text-slate-700 border-slate-200"
                  : "bg-yellow-50 text-yellow-800 border-yellow-200"
              }`}
            >
              {order.auto ? <Zap className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {order.auto ? "Auto" : "Manuel"}
            </span>
            {/* Warning (rare — ex. "En retard") */}
            {showWarningBadge && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-3 h-3" />
                {warningLabel ?? "Attention"}
              </span>
            )}
          </div>

          {/* Ligne 3 : client */}
          <div className="flex items-center gap-1.5 text-xs text-gray-700 mb-0.5">
            <User className="w-3 h-3 shrink-0 text-gray-400" />
            <span className="truncate font-medium">{getClientName(order)}</span>
            {order.phone && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
                <Phone className="w-2.5 h-2.5" />
                {order.phone}
              </span>
            )}
          </div>

          {/* Ligne 4 : adresse (delivery) */}
          {order.type === OrderType.DELIVERY && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{getAddressShort(order)}</span>
            </div>
          )}

          {/* Footer : bouton "Faire le paiement" ou label "Paiement en attente" si !paied */}
          <PaymentAction order={order} onPay={onPayClick} />
        </div>
      </div>
    </button>
  );
};

// ─── Action paiement : bouton ou label selon le contexte ─────────────────────

/**
 * Footer de la card — règle métier :
 *   - `paied === true` → pas d'affichage (rien à faire)
 *   - `!paied` + OFFLINE + status ∈ {PICKED_UP, COLLECTED, COMPLETED}
 *     → bouton « Faire le paiement » cliquable → ouvre le drawer sur le tab Paiement
 *   - `!paied` dans tous les autres cas (ACCEPTED/READY OFFLINE, ONLINE en attente)
 *     → label informatif « Paiement en attente » non cliquable
 */
function PaymentAction({ order, onPay }: { order: Order; onPay?: () => void }) {
  if (order.paied) return null;

  const isOffline = order.payment_method === PaymentMethod.OFFLINE;
  const canPay = isOffline && PAYABLE_STATUSES.includes(order.status);

  if (canPay) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPay?.();
        }}
        className="w-full mt-3 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg bg-[#F17922] text-white hover:bg-[#D96A1D] transition shadow-sm"
      >
        <Wallet className="w-3.5 h-3.5" />
        Faire le paiement
        <ArrowRight className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="mt-3 py-1.5 px-3 inline-flex items-center justify-center gap-1.5 w-full text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" />
      Paiement en attente
    </div>
  );
}

// ─── Ring d'urgence : compte-à-rebours visuel ─────────────────────────────────

function UrgencyRing({
  progress,
  color,
  label,
}: {
  progress: number;
  color: string;
  label: string | null;
}) {
  const size = 48;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;
  // Le label ticking peut faire jusqu'à 5 char ("1m59s"), on réduit un peu au-delà de 4 char.
  const text = label ?? "—";
  const textClass = text.length >= 5 ? "text-[9px]" : "text-[10px]";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={`absolute ${textClass} font-bold tabular-nums`} style={{ color }}>
        {text}
      </div>
    </div>
  );
}
