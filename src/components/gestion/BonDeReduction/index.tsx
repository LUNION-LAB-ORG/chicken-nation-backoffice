"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDashboardStore } from "@/store/dashboardStore";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useVoucherListQuery, useVoucherDetailQuery, useVoucherRedemptionsQuery } from "../../../../features/voucher/queries/voucher.queries";
import { useCreateVoucherMutation, useCancelVoucherMutation, useDeleteVoucherMutation, useRestoreVoucherMutation } from "../../../../features/voucher/queries/voucher.mutations";
import { useCustomerListQuery } from "../../../../features/customer/queries/customer-list.query";
import { Voucher, VoucherStatus, Redemption } from "../../../../features/voucher/types/voucher.types";
import { useOrderDetailQuery } from "../../../../features/orders/queries/order-detail.query";
import { mapApiOrderToUiOrder } from "../../../../features/orders/utils/orderMapper";
import OrderDetailModal from "../../../../features/orders/components/detail-order/OrderDetailModal";
import {
  Ticket,
  Plus,
  X,
  MoreHorizontal,
  Ban,
  Trash2,
  RotateCcw,
  Eye,
  ArrowLeft,
  Calendar,
  User,
  CreditCard,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

// --- Helpers ---

const formatFCFA = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(amount) + " FCFA";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusConfig: Record<VoucherStatus, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Actif", bg: "bg-green-100", text: "text-green-700" },
  REDEEMED: { label: "Utilisé", bg: "bg-blue-100", text: "text-blue-700" },
  EXPIRED: { label: "Expiré", bg: "bg-red-100", text: "text-red-700" },
  CANCELLED: { label: "Annulé", bg: "bg-gray-100", text: "text-gray-600" },
};

const StatusBadge = ({ status }: { status: VoucherStatus }) => {
  const config = statusConfig[status] || statusConfig.ACTIVE;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// --- Stats Header ---

const StatsHeader = ({ vouchers }: { vouchers?: Voucher[] }) => {
  const stats = useMemo(() => {
    if (!vouchers || vouchers.length === 0)
      return { activeCount: 0, totalAmount: 0, redeemedCount: 0 };

    const activeCount = vouchers.filter((v) => v.status === "ACTIVE").length;
    const totalAmount = vouchers.reduce((sum, v) => sum + v.initialAmount, 0);
    const redeemedCount = vouchers.filter((v) => v.status === "REDEEMED").length;

    return { activeCount, totalAmount, redeemedCount };
  }, [vouchers]);

  const cards = [
    { label: "Bons actifs", value: stats.activeCount, icon: Ticket, color: "text-green-600", bg: "bg-green-50" },
    { label: "Montant total", value: formatFCFA(stats.totalAmount), icon: CreditCard, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Bons utilisés", value: stats.redeemedCount, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className={`${card.bg} p-3 rounded-xl`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Filter Bar ---

const statusFilters: { key: VoucherStatus | null; label: string }[] = [
  { key: null, label: "Tous" },
  { key: "ACTIVE", label: "Actifs" },
  { key: "REDEEMED", label: "Utilisés" },
  { key: "EXPIRED", label: "Expirés" },
  { key: "CANCELLED", label: "Annulés" },
];

const VoucherFilterBar = () => {
  const {
    voucher: { filters },
    setFilter,
    setPagination,
  } = useDashboardStore();

  const handleStatusChange = (status: VoucherStatus | null) => {
    setFilter("voucher", "status", status);
    setPagination("voucher", 1, 10);
  };

  return (
    <div className="mb-6">
      <div className="text-xs font-semibold text-gray-600 mb-2">STATUT</div>
      <div className="w-full overflow-x-auto">
        <div className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit min-w-full scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent" style={{ minHeight: 40 }}>
          {statusFilters.map((sf) => (
            <button
              key={sf.key ?? "all"}
              className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px] px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap shrink-0 ml-1
                ${
                  (filters?.status ?? null) === sf.key
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
              `}
              style={{ minWidth: 75, height: 30 }}
              onClick={() => handleStatusChange(sf.key)}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Create Voucher Modal ---

const CreateVoucherModal = ({ onClose }: { onClose: () => void }) => {
  const [amount, setAmount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: customersData } = useCustomerListQuery({
    search: customerSearch,
    limit: 10,
  });

  const createMutation = useCreateVoucherMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !customerId) return;

    createMutation.mutate(
      {
        initialAmount: Number(amount),
        customerId,
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  const selectedCustomer = customersData?.data?.find((c) => c.id === customerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Nouveau bon</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setCustomerId("");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
            />
            {customerSearch && !customerId && customersData?.data && customersData.data.length > 0 && (
              <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customersData.data.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm cursor-pointer"
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerSearch(`${c.first_name ?? ""} ${c.last_name ?? ""} - ${c.phone}`);
                    }}
                  >
                    <span className="font-medium">{c.first_name ?? ""} {c.last_name ?? ""}</span>
                    <span className="text-gray-500 ml-2">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-2 flex items-center gap-2 bg-green-50 text-green-700 text-sm px-3 py-1.5 rounded-lg">
                <User className="w-4 h-4" />
                {selectedCustomer.first_name ?? ""} {selectedCustomer.last_name ?? ""} — {selectedCustomer.phone}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 5000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
            />
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;expiration (optionnel)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!customerId || !amount || createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[#F17922] rounded-lg hover:bg-[#d96a1c] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {createMutation.isPending ? "Création..." : "Créer le bon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Action Dropdown ---

const VoucherActions = ({ voucher, onView }: { voucher: Voucher; onView: () => void }) => {
  const [open, setOpen] = useState(false);
  const cancelMutation = useCancelVoucherMutation();
  const deleteMutation = useDeleteVoucherMutation();
  const restoreMutation = useRestoreVoucherMutation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !(e.target as Element).closest(".voucher-context-menu") &&
        !(e.target as Element).closest(".voucher-menu-button")
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  const renderMenu = () => {
    if (!open || !buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    return createPortal(
      <div
        className="voucher-context-menu"
        style={{
          position: "absolute",
          top: `${rect.bottom + window.scrollY}px`,
          left: `${rect.right - 160 + window.scrollX}px`,
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          <button
            onClick={() => { onView(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Voir détails
          </button>
          {voucher.status === "ACTIVE" && (
            <button
              onClick={() => { cancelMutation.mutate(voucher.code); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 cursor-pointer"
            >
              <Ban className="w-4 h-4" /> Annuler
            </button>
          )}
          {voucher.entityStatus !== "DELETED" ? (
            <button
              onClick={() => { deleteMutation.mutate(voucher.code); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          ) : (
            <button
              onClick={() => { restoreMutation.mutate(voucher.code); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Restaurer
            </button>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="voucher-menu-button p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>
      {renderMenu()}
    </div>
  );
};

// --- Voucher Table ---

const VoucherTable = ({
  vouchers,
  isLoading,
  onViewDetail,
}: {
  vouchers: Voucher[];
  isLoading: boolean;
  onViewDetail: (code: string) => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Ticket className="w-12 h-12 mb-3" />
        <p className="text-sm">Aucun bon trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant initial</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant restant</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Créé par</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date expiration</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((v) => (
            <tr
              key={v.id}
              className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
              onClick={() => onViewDetail(v.code)}
            >
              <td className="px-4 py-3">
                <span className="font-mono text-sm font-medium text-[#F17922]">{v.code}</span>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900">
                  {v.customer?.firstName ?? ""} {v.customer?.lastName ?? ""}
                </div>
                <div className="text-xs text-gray-500">{v.customer?.phone}</div>
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                {formatFCFA(v.initialAmount)}
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                {formatFCFA(v.remainingAmount)}
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={v.status} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{v.createdBy?.fullName ?? "—"}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(v.expiresAt)}</td>
              <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                <VoucherActions voucher={v} onView={() => onViewDetail(v.code)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Pagination ---

const Pagination = ({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-600">
        Page {page} sur {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Detail View ---

const RedemptionOrderCell = ({ redemption }: { redemption: Redemption }) => {
  const orderId = redemption.order?.id ?? redemption.orderId;
  const orderRef = redemption.order?.orderNumber;
  const [showModal, setShowModal] = useState(false);

  if (!orderId) return <span className="text-gray-400">—</span>;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-[#F17922] hover:text-[#d96a1c] hover:underline cursor-pointer"
      >
        #{orderRef ?? "Commande"}
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      {showModal && (
        <RedemptionOrderModal orderId={orderId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

const RedemptionOrderModal = ({ orderId, onClose }: { orderId: string; onClose: () => void }) => {
  const { data: orderDetail, isLoading } = useOrderDetailQuery(orderId);
  const mappedOrder = orderDetail ? mapApiOrderToUiOrder(orderDetail) : null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
        </div>
      </div>
    );
  }

  if (!mappedOrder) {
    onClose();
    return null;
  }

  return <OrderDetailModal order={mappedOrder} onClose={onClose} />;
};

const VoucherDetailView = ({ code, onBack }: { code: string; onBack: () => void }) => {
  const { data: voucher, isLoading } = useVoucherDetailQuery(code);
  const { data: redemptions, isLoading: redemptionsLoading } = useVoucherRedemptionsQuery(code);
  const cancelMutation = useCancelVoucherMutation();
  const deleteMutation = useDeleteVoucherMutation();
  const restoreMutation = useRestoreVoucherMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="text-center text-gray-400 py-16">
        <p>Bon introuvable</p>
        <button onClick={onBack} className="mt-4 text-[#F17922] text-sm font-medium cursor-pointer">
          Retour à la liste
        </button>
      </div>
    );
  }

  const usagePercentage = voucher.initialAmount > 0
    ? Math.round(((voucher.initialAmount - voucher.remainingAmount) / voucher.initialAmount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Retour à la liste
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold font-mono text-[#F17922]">{voucher.code}</h2>
              <StatusBadge status={voucher.status} />
            </div>
            <p className="text-sm text-gray-500">Créé le {formatDateTime(voucher.createdAt)} par {voucher.createdBy?.fullName ?? "—"}</p>
          </div>
          <div className="flex gap-2">
            {voucher.status === "ACTIVE" && (
              <button
                onClick={() => cancelMutation.mutate(voucher.code)}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Annuler
              </button>
            )}
            {voucher.entityStatus !== "DELETED" ? (
              <button
                onClick={() => deleteMutation.mutate(voucher.code)}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            ) : (
              <button
                onClick={() => restoreMutation.mutate(voucher.code)}
                disabled={restoreMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" /> Restaurer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <CreditCard className="w-4 h-4" /> Montant initial
          </div>
          <p className="text-xl font-bold text-gray-900">{formatFCFA(voucher.initialAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <CreditCard className="w-4 h-4" /> Montant restant
          </div>
          <p className="text-xl font-bold text-gray-900">{formatFCFA(voucher.remainingAmount)}</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#F17922] h-2 rounded-full transition-all"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{usagePercentage}% utilisé</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <User className="w-4 h-4" /> Client
          </div>
          <p className="text-sm font-medium text-gray-900">
            {voucher.customer?.firstName ?? ""} {voucher.customer?.lastName ?? ""}
          </p>
          <p className="text-xs text-gray-500">{voucher.customer?.phone}</p>
          {voucher.customer?.email && (
            <p className="text-xs text-gray-500">{voucher.customer.email}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="w-4 h-4" /> Expiration
          </div>
          <p className="text-sm font-medium text-gray-900">{formatDate(voucher.expiresAt)}</p>
        </div>
      </div>

      {/* Redemptions history */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">Historique des utilisations</h3>
        {redemptionsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F17922]" />
          </div>
        ) : !redemptions || redemptions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune utilisation enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Commande</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatFCFA(r.amount)}</td>
                    <td className="px-4 py-3">
                      <RedemptionOrderCell redemption={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

export default function BonDeReduction() {
  const {
    voucher: { view, filters, pagination },
    setFilter,
    setSectionView,
    setSelectedItem,
    setPagination,
    toggleModal,
  } = useDashboardStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const selectedCode = useDashboardStore((s) => s.voucher.selectedItem as string | undefined);

  const {
    data: vouchersData,
    isLoading,
    error,
  } = useVoucherListQuery({
    page: pagination.page,
    limit: pagination.limit,
    status: filters?.status as VoucherStatus | undefined,
    search: filters?.search as string | undefined,
  });

  const handleSearch = useCallback(
    (query: string) => {
      setFilter("voucher", "search", query);
      setPagination("voucher", 1, 10);
    },
    [setFilter, setPagination]
  );

  const handleViewDetail = useCallback(
    (code: string) => {
      setSelectedItem("voucher", code);
      setSectionView("voucher", "view");
    },
    [setSelectedItem, setSectionView]
  );

  const handleBackToList = useCallback(() => {
    setSelectedItem("voucher", undefined);
    setSectionView("voucher", "list");
  }, [setSelectedItem, setSectionView]);

  const handlePageChange = useCallback(
    (page: number) => {
      setPagination("voucher", page, pagination.limit);
    },
    [setPagination, pagination.limit]
  );

  // Detail view
  if (view === "view" && selectedCode) {
    return (
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="-mt-10">
          <DashboardPageHeader
            mode="view"
            onBack={handleBackToList}
            title="Détail du bon"
            gradient={true}
          />
        </div>
        <VoucherDetailView code={selectedCode} onBack={handleBackToList} />
      </div>
    );
  }

  // List view
  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Bons"
          searchConfig={{
            placeholder: "Rechercher par code ou client...",
            buttonText: "Chercher",
            value: filters?.search as string,
            onSearch: handleSearch,
            realTimeSearch: true,
          }}
          actions={[
            {
              label: "Nouveau bon",
              icon: Plus,
              onClick: () => setShowCreateModal(true),
            },
          ]}
        />
      </div>

      <StatsHeader vouchers={vouchersData?.data} />

      <div className="min-h-[600px]">
        <VoucherFilterBar />
        <VoucherTable
          vouchers={vouchersData?.data ?? []}
          isLoading={isLoading}
          onViewDetail={handleViewDetail}
        />
        {vouchersData?.meta && (
          <Pagination
            page={vouchersData.meta.page}
            totalPages={vouchersData.meta.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {showCreateModal && <CreateVoucherModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
