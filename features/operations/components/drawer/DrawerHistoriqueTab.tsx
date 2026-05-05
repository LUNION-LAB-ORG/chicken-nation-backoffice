"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  History as HistoryIcon,
  Loader2,
  Package,
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";

import { type Order } from "../../../orders/types/order.types";
import { getAllOrders } from "../../../orders/services/order-service";
import { mapApiOrderToUiOrder } from "../../../orders/utils/orderMapper";
import type { OrderTable } from "../../../orders/types/ordersTable.types";

interface Props {
  order: Order;
}

function formatPrice(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("fr-FR").replace(/\s/g, ".")} F`;
}

/**
 * Tab Historique du drawer Opérations.
 *
 * Contient uniquement le carnet de commandes passées du client (pagination,
 * lignes repliables avec images et détails d'articles). La fiche client est
 * maintenant dans le tab Détails directement sous le hero — on évite ici la
 * redondance et on laisse toute la place à l'historique.
 */
export function DrawerHistoriqueTab({ order }: Props) {
  const ui = React.useMemo(() => mapApiOrderToUiOrder(order), [order]);
  return (
    <div className="p-5 md:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-xl bg-[#FFF0E4] text-[#F17922] flex items-center justify-center">
          <HistoryIcon className="w-4 h-4" />
        </span>
        <h3 className="text-[15px] font-bold text-gray-900">Historique des commandes</h3>
      </div>
      <HistoriqueList customerId={ui.customerId} currentOrderId={order.id} />
    </div>
  );
}

// ─── Liste ─────────────────────────────────────────────────────────────────

function HistoriqueList({
  customerId,
  currentOrderId,
}: {
  customerId: string | null | undefined;
  currentOrderId: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "customer-list", customerId, page],
    queryFn: () =>
      getAllOrders({
        customerId: customerId ?? "",
        limit: 10,
        page,
        sortBy: "created_at",
        sortOrder: "desc",
        startDate: "01/01/2020",
        endDate: "31/12/2099",
      }),
    enabled: !!customerId,
  });

  if (!customerId) {
    return (
      <div className="py-10 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
        Aucun client rattaché à cette commande.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-10 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement du carnet…
      </div>
    );
  }

  const orders = (data?.data || []).map(mapApiOrderToUiOrder);
  const meta = data?.meta;

  if (orders.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
        Aucune commande précédente.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {meta && (
        <p className="text-[11px] text-gray-500 mb-1">
          {meta.total} commande{meta.total > 1 ? "s" : ""} au total
        </p>
      )}
      {orders.map((o) => (
        <HistoriqueRow
          key={o.id}
          order={o}
          expanded={expandedId === o.id}
          current={o.id === currentOrderId}
          onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
        />
      ))}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <span className="text-[11px] text-gray-400">
            Page {meta.page}/{meta.totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-[11px] font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-[11px] font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ligne ─────────────────────────────────────────────────────────────────

function HistoriqueRow({
  order,
  expanded,
  current,
  onToggle,
}: {
  order: OrderTable;
  expanded: boolean;
  current: boolean;
  onToggle: () => void;
}) {
  const statusTone = statusToTone(order.status);
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition ${
        current
          ? "border-[#F17922]/40 bg-[#FFF8F2]"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-gray-900">#{order.reference}</span>
            {current && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F17922] text-white">
                Actuelle
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusTone}`}
            >
              {order.status}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-0.5">
            {format(new Date(order.createdAt), "dd MMM yyyy · HH:mm", { locale: fr })} ·{" "}
            {order.orderType}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-[#F17922] tabular-nums">
            {formatPrice(order.amount)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <ul className="mt-3 space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 shrink-0">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                  {item.price === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-[#F17922] text-white text-[8px] font-bold text-center py-0.5">
                      Offert
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                  {item.supplements && (
                    <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                      <Package className="w-2.5 h-2.5" />
                      {item.supplements}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 shrink-0 font-semibold">
                  ×{item.quantity}
                </span>
                <span className="text-xs font-bold text-gray-700 shrink-0 tabular-nums">
                  {item.price === 0 ? "Offert" : formatPrice(item.price)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <Mini label="Sous-total" value={formatPrice(order.netAmount)} />
            <Mini label="Livraison" value={formatPrice(order.deliveryFee)} />
            {order.discount > 0 && (
              <Mini label="Remise" value={`− ${formatPrice(order.discount)}`} tone="red" />
            )}
            <Mini label="Canal" value={order.paymentChannel} />
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "red";
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span
        className={
          tone === "red"
            ? "text-red-500 font-semibold tabular-nums"
            : "text-gray-800 font-semibold tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function statusToTone(status: string): string {
  if (status === "LIVRÉE" || status === "TERMINÉE") {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (status === "ANNULÉE") {
    return "bg-red-50 text-red-600 border-red-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}
