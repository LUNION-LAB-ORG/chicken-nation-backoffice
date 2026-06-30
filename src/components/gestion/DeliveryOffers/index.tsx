"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  useDeliveryOffersQuery,
  useDeliveryOfferStatsQuery,
} from "../../../../features/delivery_offers/queries/delivery-offer.queries";
import {
  useCreateDeliveryOfferMutation,
  useDeleteDeliveryOfferMutation,
  useToggleDeliveryOfferMutation,
  useUpdateDeliveryOfferMutation,
} from "../../../../features/delivery_offers/queries/delivery-offer.mutations";
import {
  CreateDeliveryOfferDto,
  DeliveryOffer,
  DeliveryOfferChannel,
  DeliveryOfferQuery,
  DeliveryOfferType,
} from "../../../../features/delivery_offers/types/delivery-offer.types";
import { useRestaurantListQuery } from "../../../../features/restaurants/queries/restaurant-list.query";
import { toast } from "react-hot-toast";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";

const TYPE_LABEL: Record<DeliveryOfferType, string> = {
  FREE_DELIVERY: "Livraison gratuite",
  PERCENTAGE: "Réduction %",
  FIXED_AMOUNT: "Montant fixe",
};
const CHANNEL_LABEL: Record<DeliveryOfferChannel, string> = {
  APP: "App",
  CALL_CENTER: "Call center",
  BOTH: "Les deux",
};
const DAYS: { key: string; label: string }[] = [
  { key: "monday", label: "Lun" },
  { key: "tuesday", label: "Mar" },
  { key: "wednesday", label: "Mer" },
  { key: "thursday", label: "Jeu" },
  { key: "friday", label: "Ven" },
  { key: "saturday", label: "Sam" },
  { key: "sunday", label: "Dim" },
];

function describeOffer(o: DeliveryOffer): string {
  if (o.type === "FREE_DELIVERY") return "Gratuite";
  if (o.type === "PERCENTAGE") return `-${o.value}%`;
  return `-${o.value.toLocaleString()} F`;
}

export default function DeliveryOffers() {
  const [query, setQuery] = useState<DeliveryOfferQuery>({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DeliveryOffer | null>(null);
  const [deleting, setDeleting] = useState<DeliveryOffer | null>(null);

  const effectiveQuery = useMemo<DeliveryOfferQuery>(() => {
    const q: DeliveryOfferQuery = { ...query };
    if (search.trim()) q.search = search.trim();
    if (filterActive === "active") q.is_active = true;
    if (filterActive === "inactive") q.is_active = false;
    return q;
  }, [query, search, filterActive]);

  const { data, isLoading, isFetching } = useDeliveryOffersQuery(effectiveQuery);
  const { data: stats } = useDeliveryOfferStatsQuery();
  const createM = useCreateDeliveryOfferMutation();
  const updateM = useUpdateDeliveryOfferMutation();
  const deleteM = useDeleteDeliveryOfferMutation();
  const toggleM = useToggleDeliveryOfferMutation();

  const offers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex-1 px-4 pt-4 pb-10 space-y-5">
      {/* Header (aligné sur les autres pages) */}
      <DashboardPageHeader
        mode="list"
        title="Offres de livraison"
        subtitle="Promotions sur les frais de livraison (gratuite, réduction…)."
        searchConfig={{
          placeholder: "Rechercher une offre...",
          value: search,
          realTimeSearch: true,
          onSearch: (v: string) => {
            setSearch(v);
            setQuery((p) => ({ ...p, page: 1 }));
          },
        }}
        actions={[
          {
            label: "Nouvelle offre",
            onClick: () => setShowCreate(true),
            variant: "primary" as const,
            icon: Plus,
          },
        ]}
      />

      {/* Stats rapides */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>
            {stats?.active ?? 0} active{(stats?.active ?? 0) > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Truck size={14} />
          <span>{stats?.total ?? 0} au total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setFilterActive(v);
                setQuery((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterActive === v
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {v === "all" ? "Toutes" : v === "active" ? "Actives" : "Inactives"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Offre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Canal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Période</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Truck size={32} />
                      <p className="text-sm">Aucune offre de livraison</p>
                    </div>
                  </td>
                </tr>
              ) : (
                offers.map((o) => (
                  <tr
                    key={o.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      isFetching ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{o.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-orange-50 text-[#F17922] font-semibold text-xs">
                        {describeOffer(o)}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{TYPE_LABEL[o.type]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{CHANNEL_LABEL[o.channel]}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-xs text-gray-600">
                        <div>{new Date(o.start_date).toLocaleDateString()}</div>
                        <div className="text-gray-400">au {new Date(o.expiration_date).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          o.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${o.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                        {o.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleM.mutate(o.id)}
                          title={o.is_active ? "Désactiver" : "Activer"}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {o.is_active ? (
                            <ToggleRight size={18} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={18} className="text-gray-400" />
                          )}
                        </button>
                        <button onClick={() => setEditing(o)} title="Modifier" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil size={16} className="text-gray-500" />
                        </button>
                        <button onClick={() => setDeleting(o)} title="Supprimer" className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
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
              {meta.total} résultat{meta.total > 1 ? "s" : ""} - Page {meta.page} sur {meta.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setQuery((p) => ({ ...p, page: Math.max(1, meta.page - 1) }))}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (meta.totalPages <= 5) pageNum = i + 1;
                else if (meta.page <= 3) pageNum = i + 1;
                else if (meta.page >= meta.totalPages - 2) pageNum = meta.totalPages - 4 + i;
                else pageNum = meta.page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setQuery((p) => ({ ...p, page: pageNum }))}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === meta.page ? "bg-[#F17922] text-white" : "hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setQuery((p) => ({ ...p, page: meta.page + 1 }))}
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
      {showCreate && (
        <OfferFormModal
          offer={null}
          isLoading={createM.isPending}
          onClose={() => setShowCreate(false)}
          onSubmit={(dto) => createM.mutate(dto, { onSuccess: () => setShowCreate(false) })}
        />
      )}
      {editing && (
        <OfferFormModal
          offer={editing}
          isLoading={updateM.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(dto) =>
            updateM.mutate({ id: editing.id, data: dto }, { onSuccess: () => setEditing(null) })
          }
        />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Supprimer l&apos;offre</h3>
            <p className="text-sm text-gray-600 mb-5">
              Supprimer « {deleting.name} » ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">
                Annuler
              </button>
              <button
                onClick={() => deleteM.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
                disabled={deleteM.isPending}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  Formulaire création / édition
// ════════════════════════════════════════════════════════════════════════

interface FormData {
  name: string;
  description: string;
  type: DeliveryOfferType;
  value: number;
  min_order_amount: number;
  channel: DeliveryOfferChannel;
  restaurant_ids: string[];
  target_standard: boolean;
  target_premium: boolean;
  target_gold: boolean;
  days_of_week: string[];
  time_start: string;
  time_end: string;
  start_date: string;
  expiration_date: string;
  max_usage: number | undefined;
  max_usage_per_user: number | undefined;
  is_active: boolean;
  priority: number;
}

function toLocalInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}

function OfferFormModal({
  offer,
  onClose,
  onSubmit,
  isLoading,
}: {
  offer: DeliveryOffer | null;
  onClose: () => void;
  onSubmit: (dto: CreateDeliveryOfferDto) => void;
  isLoading: boolean;
}) {
  const { data: restaurantsResp } = useRestaurantListQuery();
  const restaurants = useMemo(
    () => (restaurantsResp?.data ?? []) as { id: string; name: string }[],
    [restaurantsResp],
  );

  const [form, setForm] = useState<FormData>(() => {
    if (offer) {
      return {
        name: offer.name,
        description: offer.description ?? "",
        type: offer.type,
        value: offer.value,
        min_order_amount: offer.min_order_amount ?? 0,
        channel: offer.channel,
        restaurant_ids: offer.restaurant_ids,
        target_standard: offer.target_standard,
        target_premium: offer.target_premium,
        target_gold: offer.target_gold,
        days_of_week: offer.days_of_week,
        time_start: offer.time_start ?? "",
        time_end: offer.time_end ?? "",
        start_date: toLocalInput(offer.start_date),
        expiration_date: toLocalInput(offer.expiration_date),
        max_usage: offer.max_usage ?? undefined,
        max_usage_per_user: offer.max_usage_per_user ?? undefined,
        is_active: offer.is_active,
        priority: offer.priority,
      };
    }
    return {
      name: "",
      description: "",
      type: "FREE_DELIVERY",
      value: 0,
      min_order_amount: 0,
      channel: "APP",
      restaurant_ids: [],
      target_standard: false,
      target_premium: false,
      target_gold: false,
      days_of_week: [],
      time_start: "",
      time_end: "",
      start_date: new Date().toISOString().slice(0, 16),
      expiration_date: "",
      max_usage: undefined,
      max_usage_per_user: undefined,
      is_active: true,
      priority: 0,
    };
  });

  const [showAdvanced, setShowAdvanced] = useState<boolean>(
    () =>
      !!(
        offer &&
        (offer.days_of_week.length ||
          offer.time_start ||
          offer.time_end ||
          offer.target_standard ||
          offer.target_premium ||
          offer.target_gold ||
          offer.restaurant_ids.length ||
          offer.max_usage ||
          offer.max_usage_per_user ||
          offer.priority)
      ),
  );

  const summary = useMemo(() => {
    const what =
      form.type === "FREE_DELIVERY"
        ? "Livraison gratuite"
        : form.type === "PERCENTAGE"
          ? `Frais de livraison −${form.value || 0}%`
          : `Frais de livraison −${(form.value || 0).toLocaleString()} F`;
    const where =
      form.channel === "APP"
        ? "sur l'app"
        : form.channel === "CALL_CENTER"
          ? "au call center"
          : "app + call center";
    const cond =
      form.min_order_amount > 0
        ? ` dès ${form.min_order_amount.toLocaleString()} F d'achat`
        : "";
    const when =
      form.start_date && form.expiration_date
        ? ` · du ${new Date(form.start_date).toLocaleDateString()} au ${new Date(
            form.expiration_date,
          ).toLocaleDateString()}`
        : "";
    return `${what} ${where}${cond}${when}.`;
  }, [form]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleArray = (key: "restaurant_ids" | "days_of_week", v: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v],
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Le nom est requis");
    if (form.type === "PERCENTAGE" && (form.value <= 0 || form.value > 100))
      return toast.error("Le pourcentage doit être entre 1 et 100");
    if (form.type === "FIXED_AMOUNT" && form.value <= 0)
      return toast.error("Le montant doit être supérieur à 0");
    if (!form.start_date || !form.expiration_date)
      return toast.error("Les dates de début et de fin sont requises");
    if (new Date(form.expiration_date) <= new Date(form.start_date))
      return toast.error("La date de fin doit être après la date de début");

    const dto: CreateDeliveryOfferDto = {
      name: form.name.trim(),
      description: form.description || undefined,
      type: form.type,
      value: form.type === "FREE_DELIVERY" ? 0 : form.value,
      min_order_amount: form.min_order_amount || 0,
      channel: form.channel,
      restaurant_ids: form.restaurant_ids,
      target_standard: form.target_standard,
      target_premium: form.target_premium,
      target_gold: form.target_gold,
      days_of_week: form.days_of_week,
      time_start: form.time_start || undefined,
      time_end: form.time_end || undefined,
      start_date: new Date(form.start_date).toISOString(),
      expiration_date: new Date(form.expiration_date).toISOString(),
      max_usage: form.max_usage || undefined,
      max_usage_per_user: form.max_usage_per_user ?? undefined,
      is_active: form.is_active,
      priority: form.priority || 0,
    };
    onSubmit(dto);
  };

  const input =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";
  const label = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {offer ? "Modifier l'offre" : "Nouvelle offre de livraison"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[74vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Résumé en clair */}
            <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-sm text-[#9a4d12]">
              {summary}
            </div>

            {/* ─────────── L'offre ─────────── */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                L&apos;offre
              </h3>
              <div>
                <label className={label}>Nom de l&apos;offre</label>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Livraison gratuite weekend" className={input} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Type d&apos;offre</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value as DeliveryOfferType)} className={`${input} bg-white`}>
                    <option value="FREE_DELIVERY">Livraison gratuite</option>
                    <option value="PERCENTAGE">Réduction (%) du frais</option>
                    <option value="FIXED_AMOUNT">Montant fixe déduit (FCFA)</option>
                  </select>
                </div>
                {form.type !== "FREE_DELIVERY" && (
                  <div>
                    <label className={label}>Valeur {form.type === "PERCENTAGE" ? "(%)" : "(FCFA)"}</label>
                    <input type="number" value={form.value || ""} onChange={(e) => set("value", Number(e.target.value))} min={0} max={form.type === "PERCENTAGE" ? 100 : undefined} className={input} />
                  </div>
                )}
              </div>
              <div>
                <label className={label}>Description (optionnel)</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`${input} resize-none`} />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* ─────────── Application ─────────── */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Application
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Canal</label>
                  <select value={form.channel} onChange={(e) => set("channel", e.target.value as DeliveryOfferChannel)} className={`${input} bg-white`}>
                    <option value="APP">App uniquement</option>
                    <option value="CALL_CENTER">Call center uniquement</option>
                    <option value="BOTH">Les deux</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Montant min. commande (FCFA)</label>
                  <input type="number" value={form.min_order_amount || ""} onChange={(e) => set("min_order_amount", Number(e.target.value))} min={0} step={100} placeholder="0 = aucune condition" className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Date de début</label>
                  <input type="datetime-local" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>Date de fin</label>
                  <input type="datetime-local" value={form.expiration_date} onChange={(e) => set("expiration_date", e.target.value)} className={input} />
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* ─────────── Conditions avancées (repliable) ─────────── */}
            <section>
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Conditions avancées
                  <span className="ml-2 normal-case font-normal text-gray-400">
                    ciblage, jours, créneaux, limites — optionnel
                  </span>
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>

              {showAdvanced && (
                <div className="space-y-5 mt-5">
                  {/* Restaurants */}
                  <div>
                    <label className={label}>Restaurants ciblés (aucun = tous)</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {restaurants.map((r) => (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => toggleArray("restaurant_ids", r.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs border ${
                            form.restaurant_ids.includes(r.id)
                              ? "bg-orange-50 text-[#F17922] border-[#F17922]"
                              : "bg-white text-gray-600 border-gray-200"
                          }`}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jours */}
                  <div>
                    <label className={label}>Jours concernés (vide = tous)</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((d) => (
                        <button
                          type="button"
                          key={d.key}
                          onClick={() => toggleArray("days_of_week", d.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                            form.days_of_week.includes(d.key)
                              ? "bg-[#F17922] text-white border-[#F17922]"
                              : "bg-white text-gray-600 border-gray-200"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Créneau horaire */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Heure de début (optionnel)</label>
                      <input type="time" value={form.time_start} onChange={(e) => set("time_start", e.target.value)} className={input} />
                    </div>
                    <div>
                      <label className={label}>Heure de fin (optionnel)</label>
                      <input type="time" value={form.time_end} onChange={(e) => set("time_end", e.target.value)} className={input} />
                    </div>
                  </div>

                  {/* Ciblage fidélité */}
                  <div>
                    <label className={label}>Niveaux fidélité ciblés (aucun = tous)</label>
                    <div className="flex gap-4">
                      {([
                        ["target_standard", "Standard"],
                        ["target_premium", "Premium"],
                        ["target_gold", "Gold"],
                      ] as const).map(([key, lbl]) => (
                        <label key={key} className="flex items-center gap-1.5 text-sm text-gray-700">
                          <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                          {lbl}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Limites d'usage + priorité */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={label}>Usages max (global)</label>
                      <input type="number" value={form.max_usage ?? ""} onChange={(e) => set("max_usage", e.target.value ? Number(e.target.value) : undefined)} min={1} placeholder="∞" className={input} />
                    </div>
                    <div>
                      <label className={label}>Max / client</label>
                      <input type="number" value={form.max_usage_per_user ?? ""} onChange={(e) => set("max_usage_per_user", e.target.value ? Number(e.target.value) : undefined)} min={0} placeholder="∞" className={input} />
                    </div>
                    <div>
                      <label className={label}>Priorité</label>
                      <input type="number" value={form.priority || ""} onChange={(e) => set("priority", Number(e.target.value))} placeholder="0" className={input} />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <div className="border-t border-gray-100" />

            {/* Statut */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set("is_active", !form.is_active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-[#F17922]" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`} />
              </button>
              <span className="text-sm text-gray-700">{form.is_active ? "Offre active" : "Offre inactive"}</span>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">
            Annuler
          </button>
          <button onClick={handleSubmit as unknown as () => void} disabled={isLoading} className="px-4 py-2 text-sm text-white bg-[#F17922] rounded-lg disabled:opacity-50 flex items-center gap-2">
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            {offer ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
