"use client";

import React from "react";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Store,
  User,
  Wallet,
  Zap,
} from "lucide-react";

import { format } from "date-fns";
// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import {
  AVANCE_PREPARATION_MS,
  estProgrammee,
  momentSouhaite,
} from "../../orders/utils/momentSouhaite";
import { PaymentMethod, type Order } from "../../orders/types/order.types";
import { useAuthStore } from "../../users/hook/authStore";
import { UserType } from "../../users/types/user.types";
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
  // Un compte BACKOFFICE (admin, call center) voit les commandes de TOUS les
  // restaurants sur le même tableau : sans le nom du restaurant sur la carte,
  // impossible de savoir d'où vient chacune. Un compte RESTAURANT n'en a pas
  // besoin (il ne voit que le sien) — on ne charge pas sa carte pour rien.
  const isBackoffice = useAuthStore((s) => s.user?.type) === UserType.BACKOFFICE;

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

          {/*
            COMMANDE PROGRAMMÉE : à traiter plus tard.
            
            En tête de la rangée, avant le statut, parce que c'est
            l'information qui décide s'il faut s'en occuper MAINTENANT. Sans
            elle, une commande attendue pour 20 h se mélangeait aux autres et
            partait en préparation six heures trop tôt.
            
            Le libellé change avec le moment : « Plus tard » tant que la
            préparation n'est pas ouverte, « À préparer » dès qu'elle l'est.
          */}
          {(() => {
            const moment = momentSouhaite(order.date, order.time);
            if (!estProgrammee(moment, order.created_at) || !moment) return null;
            const ouverture = new Date(moment.getTime() - AVANCE_PREPARATION_MS);
            const plusTard = Date.now() < ouverture.getTime();
            return (
              <div className="mb-2">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border ${
                    plusTard
                      ? "bg-[#FDF3E7] text-[#8A4B00] border-[#F3D5B0]"
                      : "bg-[#EAF7F0] text-[#1E8E5A] border-[#CDEBD9]"
                  }`}
                  title={
                    plusTard
                      ? `À traiter plus tard — préparation à partir de ${format(ouverture, "HH'h'mm")}`
                      : "La préparation peut commencer"
                  }
                >
                  <Clock className="w-3 h-3" />
                  {plusTard ? "Plus tard · " : "À préparer · "}
                  {format(moment, "HH'h'mm")}
                </span>
              </div>
            );
          })()}

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

          {/* Ligne restaurant — comptes BACKOFFICE uniquement (multi-restaurants). */}
          {isBackoffice && order.restaurant?.name && (
            <div className="flex items-center gap-1.5 text-xs mb-0.5">
              <Store className="w-3 h-3 shrink-0 text-[#F17922]" />
              <span className="truncate font-semibold text-gray-800">
                {order.restaurant.name}
              </span>
            </div>
          )}

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
