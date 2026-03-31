"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  Copy,
  Tag,
  Percent,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { usePromoCodesQuery, usePromoCodeStatsQuery } from "../../../../features/promo_code/queries/promo-code.queries";
import {
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
  useDeletePromoCodeMutation,
  useTogglePromoCodeMutation,
} from "../../../../features/promo_code/queries/promo-code.mutations";
import type {
  PromoCode,
  PromoCodeQuery,
  CreatePromoCodeDto,
  DiscountType,
} from "../../../../features/promo_code/types/promo-code.types";

// --- Helpers ---

const formatFCFA = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getPromoStatus = (promo: PromoCode): "active" | "inactive" | "expired" => {
  if (!promo.is_active) return "inactive";
  if (new Date(promo.expiration_date) < new Date()) return "expired";
  return "active";
};

const statusConfig = {
  active: { label: "Actif", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  inactive: { label: "Inactif", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  expired: { label: "Expiré", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

const discountTypeLabels: Record<DiscountType, string> = {
  PERCENTAGE: "Pourcentage",
  FIXED_AMOUNT: "Montant fixe",
  BUY_X_GET_Y: "Achetez X obtenez Y",
};

const generateRandomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// --- StatusBadge ---

function StatusBadge({ promo }: { promo: PromoCode }) {
  const status = getPromoStatus(promo);
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// --- Delete Confirm Modal ---

function DeleteConfirmModal({
  promo,
  onConfirm,
  onCancel,
  isLoading,
}: {
  promo: PromoCode;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Supprimer le code promo</h3>
        <p className="text-gray-600 mb-1">
          Voulez-vous vraiment supprimer le code <strong>{promo.code}</strong> ?
        </p>
        <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Create/Edit Modal ---

interface PromoCodeFormData {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | undefined;
  max_usage: number | undefined;
  max_usage_per_user: number;
  start_date: string;
  expiration_date: string;
  is_active: boolean;
  restaurant_ids: string[];
}

const defaultFormData: PromoCodeFormData = {
  code: "",
  description: "",
  discount_type: "PERCENTAGE",
  discount_value: 0,
  min_order_amount: 0,
  max_discount_amount: undefined,
  max_usage: undefined,
  max_usage_per_user: 1,
  start_date: new Date().toISOString().slice(0, 16),
  expiration_date: "",
  is_active: true,
  restaurant_ids: [],
};

function PromoCodeFormModal({
  promo,
  onClose,
  onSubmit,
  isLoading,
}: {
  promo: PromoCode | null;
  onClose: () => void;
  onSubmit: (data: CreatePromoCodeDto) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<PromoCodeFormData>(() => {
    if (promo) {
      return {
        code: promo.code,
        description: promo.description || "",
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_order_amount: promo.min_order_amount ?? 0,
        max_discount_amount: promo.max_discount_amount ?? undefined,
        max_usage: promo.max_usage ?? undefined,
        max_usage_per_user: promo.max_usage_per_user ?? 1,
        start_date: new Date(promo.start_date).toISOString().slice(0, 16),
        expiration_date: new Date(promo.expiration_date).toISOString().slice(0, 16),
        is_active: promo.is_active,
        restaurant_ids: promo.restaurant_ids,
      };
    }
    return { ...defaultFormData };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code.trim()) {
      toast.error("Le code est requis");
      return;
    }
    if (form.discount_value <= 0) {
      toast.error("La valeur de réduction doit être supérieure à 0");
      return;
    }
    if (form.discount_type === "PERCENTAGE" && form.discount_value > 100) {
      toast.error("Le pourcentage ne peut pas dépasser 100%");
      return;
    }
    if (!form.start_date || !form.expiration_date) {
      toast.error("Les dates de début et d'expiration sont requises");
      return;
    }
    if (new Date(form.expiration_date) <= new Date(form.start_date)) {
      toast.error("La date d'expiration doit être après la date de début");
      return;
    }

    const dto: CreatePromoCodeDto = {
      code: form.code.toUpperCase().trim(),
      description: form.description || undefined,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_amount: form.min_order_amount || undefined,
      max_discount_amount: form.max_discount_amount || undefined,
      max_usage: form.max_usage || undefined,
      max_usage_per_user: form.max_usage_per_user || 1,
      start_date: new Date(form.start_date).toISOString(),
      expiration_date: new Date(form.expiration_date).toISOString(),
      is_active: form.is_active,
      restaurant_ids: form.restaurant_ids.length > 0 ? form.restaurant_ids : undefined,
    };

    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {promo ? "Modifier le code promo" : "Nouveau code promo"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Code promotionnel</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Ex: PROMO2026"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, code: generateRandomCode() })}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center gap-1.5"
                title="Générer un code aléatoire"
              >
                <Sparkles size={16} />
                Générer
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optionnel)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Description du code promo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent resize-none"
            />
          </div>

          {/* Discount type & value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de réduction</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as DiscountType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent bg-white"
              >
                <option value="PERCENTAGE">Pourcentage (%)</option>
                <option value="FIXED_AMOUNT">Montant fixe (FCFA)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Valeur {form.discount_type === "PERCENTAGE" ? "(%)" : "(FCFA)"}
              </label>
              <input
                type="number"
                value={form.discount_value || ""}
                onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                min={0}
                max={form.discount_type === "PERCENTAGE" ? 100 : undefined}
                step={form.discount_type === "PERCENTAGE" ? 1 : 100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
              />
            </div>
          </div>

          {/* Min order & max discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant min. commande (FCFA)</label>
              <input
                type="number"
                value={form.min_order_amount || ""}
                onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                min={0}
                step={100}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
              />
            </div>
            {form.discount_type === "PERCENTAGE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Plafond réduction (FCFA)</label>
                <input
                  type="number"
                  value={form.max_discount_amount ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_discount_amount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min={0}
                  step={100}
                  placeholder="Illimité"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Usage limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Utilisations max. (global)</label>
              <input
                type="number"
                value={form.max_usage ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_usage: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                min={1}
                placeholder="Illimité"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Utilisations max. par client</label>
              <input
                type="number"
                value={form.max_usage_per_user || ""}
                onChange={(e) => setForm({ ...form, max_usage_per_user: Number(e.target.value) })}
                min={1}
                placeholder="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de début</label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date d'expiration</label>
              <input
                type="datetime-local"
                value={form.expiration_date}
                onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.is_active ? "bg-[#F17922]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.is_active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">
              {form.is_active ? "Actif" : "Inactif"}
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#F17922] rounded-lg hover:bg-[#d96810] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            {promo ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function CodesPromo() {
  const [query, setQuery] = useState<PromoCodeQuery>({
    page: 1,
    limit: 10,
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [searchInput, setSearchInput] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [filterType, setFilterType] = useState<DiscountType | "all">("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null);

  // Build query based on filters
  const effectiveQuery = useMemo<PromoCodeQuery>(() => {
    const q: PromoCodeQuery = { ...query };
    if (searchInput.trim()) q.code = searchInput.trim();
    if (filterActive === "active") q.is_active = true;
    if (filterActive === "inactive") q.is_active = false;
    if (filterType !== "all") q.discount_type = filterType;
    return q;
  }, [query, searchInput, filterActive, filterType]);

  const { data: promoCodesData, isLoading, isFetching } = usePromoCodesQuery(effectiveQuery);
  const { data: stats } = usePromoCodeStatsQuery();

  const createMutation = useCreatePromoCodeMutation();
  const updateMutation = useUpdatePromoCodeMutation();
  const deleteMutation = useDeletePromoCodeMutation();
  const toggleMutation = useTogglePromoCodeMutation();

  const promoCodes = promoCodesData?.data ?? [];
  const meta = promoCodesData?.meta;

  const handleCreate = useCallback(
    (data: CreatePromoCodeDto) => {
      createMutation.mutate(data, {
        onSuccess: () => setShowCreateModal(false),
      });
    },
    [createMutation],
  );

  const handleUpdate = useCallback(
    (data: CreatePromoCodeDto) => {
      if (!editingPromo) return;
      updateMutation.mutate(
        { id: editingPromo.id, data },
        { onSuccess: () => setEditingPromo(null) },
      );
    },
    [editingPromo, updateMutation],
  );

  const handleDelete = useCallback(() => {
    if (!deletingPromo) return;
    deleteMutation.mutate(deletingPromo.id, {
      onSuccess: () => setDeletingPromo(null),
    });
  }, [deletingPromo, deleteMutation]);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copié`);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setQuery((prev) => ({ ...prev, page: newPage }));
    },
    [],
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Codes promo</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos codes promotionnels</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 mr-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{stats?.activeCount ?? 0} actifs</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Tag size={14} />
              <span>{stats?.totalUsage ?? 0} utilisations</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F17922] text-white rounded-lg hover:bg-[#d96810] transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={18} />
            Nouveau code
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un code..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setQuery((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
          />
        </div>

        {/* Active filter */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(["all", "active", "inactive"] as const).map((val) => (
            <button
              key={val}
              onClick={() => {
                setFilterActive(val);
                setQuery((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterActive === val
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {val === "all" ? "Tous" : val === "active" ? "Actifs" : "Inactifs"}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as DiscountType | "all");
            setQuery((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
        >
          <option value="all">Tous les types</option>
          <option value="PERCENTAGE">Pourcentage</option>
          <option value="FIXED_AMOUNT">Montant fixe</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Description
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Réduction
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Min. commande
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Utilisations
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Période
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Tag size={32} />
                      <p className="text-sm">Aucun code promo trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                promoCodes.map((promo) => (
                  <tr
                    key={promo.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      isFetching ? "opacity-60" : ""
                    }`}
                  >
                    {/* Code */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          {promo.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(promo.code)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copier le code"
                        >
                          <Copy size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600 line-clamp-1">
                        {promo.description || "-"}
                      </span>
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {promo.discount_type === "PERCENTAGE" ? (
                          <Percent size={14} className="text-blue-500" />
                        ) : (
                          <DollarSign size={14} className="text-green-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {promo.discount_type === "PERCENTAGE"
                            ? `${promo.discount_value}%`
                            : formatFCFA(promo.discount_value)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {discountTypeLabels[promo.discount_type]}
                      </span>
                    </td>

                    {/* Min order */}
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {promo.min_order_amount ? formatFCFA(promo.min_order_amount) : "-"}
                    </td>

                    {/* Usage */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {promo.usage_count}
                      </span>
                      <span className="text-sm text-gray-400">
                        /{promo.max_usage ?? "\u221E"}
                      </span>
                    </td>

                    {/* Period */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="text-xs text-gray-600">
                        <div>{formatDate(promo.start_date)}</div>
                        <div className="text-gray-400">au {formatDate(promo.expiration_date)}</div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <StatusBadge promo={promo} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleMutation.mutate(promo.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title={promo.is_active ? "Désactiver" : "Activer"}
                        >
                          {promo.is_active ? (
                            <ToggleRight size={18} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={18} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingPromo(promo)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => setDeletingPromo(promo)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <span className="text-sm text-gray-600">
              {meta.total} résultat{meta.total > 1 ? "s" : ""} - Page {meta.page} sur{" "}
              {meta.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (meta.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (meta.page <= 3) {
                  pageNum = i + 1;
                } else if (meta.page >= meta.totalPages - 2) {
                  pageNum = meta.totalPages - 4 + i;
                } else {
                  pageNum = meta.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === meta.page
                        ? "bg-[#F17922] text-white"
                        : "hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <PromoCodeFormModal
          promo={null}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {editingPromo && (
        <PromoCodeFormModal
          promo={editingPromo}
          onClose={() => setEditingPromo(null)}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      )}

      {deletingPromo && (
        <DeleteConfirmModal
          promo={deletingPromo}
          onConfirm={handleDelete}
          onCancel={() => setDeletingPromo(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
