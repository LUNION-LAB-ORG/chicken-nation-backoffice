"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
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

  const { data, isLoading } = useDeliveryOffersQuery(effectiveQuery);
  const { data: stats } = useDeliveryOfferStatsQuery();
  const createM = useCreateDeliveryOfferMutation();
  const updateM = useUpdateDeliveryOfferMutation();
  const deleteM = useDeleteDeliveryOfferMutation();
  const toggleM = useToggleDeliveryOfferMutation();

  const offers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex-1 px-4 pt-4 pb-10 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#F17922] flex items-center gap-2">
            <Truck size={22} /> Offres de livraison
          </h1>
          <p className="text-sm text-gray-500">
            Promotions sur les frais de livraison (gratuite, réduction…).
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F17922] text-white text-sm font-semibold rounded-xl hover:bg-[#d96810]"
        >
          <Plus size={16} /> Nouvelle offre
        </button>
      </div>

      {/* Stats + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setQuery((p) => ({ ...p, page: 1 }));
          }}
          placeholder="Rechercher une offre..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setFilterActive(v);
                setQuery((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                filterActive === v ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
              }`}
            >
              {v === "all" ? "Toutes" : v === "active" ? "Actives" : "Inactives"}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {stats?.active ?? 0} active(s) / {stats?.total ?? 0}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Offre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Canal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Période</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <RefreshCw size={16} className="animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Aucune offre de livraison
                  </td>
                </tr>
              ) : (
                offers.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{o.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-orange-50 text-[#F17922] font-semibold text-xs">
                        {describeOffer(o)}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{TYPE_LABEL[o.type]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{CHANNEL_LABEL[o.channel]}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {new Date(o.start_date).toLocaleDateString()} →{" "}
                      {new Date(o.expiration_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          o.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {o.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleM.mutate(o.id)}
                          title={o.is_active ? "Désactiver" : "Activer"}
                          className="p-1.5 hover:bg-gray-100 rounded-lg"
                        >
                          {o.is_active ? (
                            <ToggleRight size={18} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={18} className="text-gray-400" />
                          )}
                        </button>
                        <button onClick={() => setEditing(o)} title="Modifier" className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Pencil size={16} className="text-gray-500" />
                        </button>
                        <button onClick={() => setDeleting(o)} title="Supprimer" className="p-1.5 hover:bg-red-50 rounded-lg">
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Page {meta?.page ?? 1} / {meta?.totalPages ?? 1}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setQuery((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
            disabled={(meta?.page ?? 1) <= 1}
            className="px-3 py-2 border rounded-lg disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setQuery((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
            disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
            className="px-3 py-2 border rounded-lg disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          <div>
            <label className={label}>Nom de l&apos;offre</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Livraison gratuite weekend" className={input} />
          </div>

          <div>
            <label className={label}>Description (optionnel)</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`${input} resize-none`} />
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

          {/* Jours + créneau */}
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
            <div className="flex gap-3">
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-[#F17922]" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className="text-sm text-gray-700">{form.is_active ? "Active" : "Inactive"}</span>
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
