"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Gift,
  Ticket,
  Tag,
  X,
  Send,
  Loader2,
  Ban,
  Search,
} from "lucide-react";
import { getCustomers } from "@/services/customerService";
import { getPromoCodes } from "../../promo_code/services/promo-code.service";
import {
  createRewardCampaign,
  listRewardCampaigns,
  cancelRewardCampaign,
} from "../services/reward-campaign.service";
import {
  LoyaltyLevel,
  RewardCampaignType,
} from "../types/reward-campaign.types";

const TYPES: {
  key: RewardCampaignType;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { key: "GIFT", label: "Cadeau", icon: Gift, desc: "Libellé + visuel, remis en restaurant" },
  { key: "VOUCHER", label: "Bon d'achat", icon: Ticket, desc: "Un montant crédité au grattage" },
  { key: "PROMO_CODE", label: "Code promo", icon: Tag, desc: "Un code promo existant" },
];

const LEVELS: { key: LoyaltyLevel; label: string }[] = [
  { key: "STANDARD", label: "Standard" },
  { key: "PREMIUM", label: "Premium" },
  { key: "GOLD", label: "Gold" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Programmée", cls: "bg-[#E7F0FB] text-[#2B6CB0]" },
  sending: { label: "Envoi…", cls: "bg-[#FEF3C7] text-[#92400E]" },
  sent: { label: "Envoyée", cls: "bg-[#E6F4EC] text-[#1E8E5A]" },
  cancelled: { label: "Annulée", cls: "bg-[#EEF1F4] text-[#6C757D]" },
  failed: { label: "Échec", cls: "bg-[#FDECEA] text-[#C0392B]" },
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-sm font-medium text-[#71717A] mb-1.5">{children}</label>
);

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

export default function SendGiftManager() {
  const qc = useQueryClient();

  const [type, setType] = useState<RewardCampaignType>("GIFT");
  const [name, setName] = useState("");
  const [giftLabel, setGiftLabel] = useState("");
  const [giftImage, setGiftImage] = useState("");
  const [amount, setAmount] = useState("");
  const [promoCode, setPromoCode] = useState("");

  const [target, setTarget] = useState<"all" | "ids">("all");
  const [level, setLevel] = useState<LoyaltyLevel | "">("");
  const [selected, setSelected] = useState<{ id: string; name: string }[]>([]);
  const [custSearch, setCustSearch] = useState("");

  const [scheduled, setScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const promoQuery = useQuery({
    queryKey: ["promo-codes-active"],
    queryFn: () => getPromoCodes(),
    enabled: type === "PROMO_CODE",
  });
  const promos = Array.isArray(promoQuery.data)
    ? promoQuery.data
    : ((promoQuery.data as { data?: unknown[] } | undefined)?.data ?? []);

  const custQuery = useQuery({
    queryKey: ["reward-cust-search", custSearch],
    queryFn: () => getCustomers({ search: custSearch, limit: 8 }),
    enabled: target === "ids" && custSearch.trim().length >= 2,
  });

  const campaignsQuery = useQuery({
    queryKey: ["reward-campaigns"],
    queryFn: listRewardCampaigns,
  });

  const createMut = useMutation({
    mutationFn: createRewardCampaign,
    onSuccess: () => {
      toast.success("Campagne créée avec succès");
      resetForm();
      qc.invalidateQueries({ queryKey: ["reward-campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancelMut = useMutation({
    mutationFn: cancelRewardCampaign,
    onSuccess: () => {
      toast.success("Campagne annulée");
      qc.invalidateQueries({ queryKey: ["reward-campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setName("");
    setGiftLabel("");
    setGiftImage("");
    setAmount("");
    setPromoCode("");
    setSelected([]);
    setCustSearch("");
    setScheduled(false);
    setScheduledAt("");
    setExpiresAt("");
  };

  const addCustomer = (c: { id: string; name: string }) => {
    setSelected((prev) => (prev.some((s) => s.id === c.id) ? prev : [...prev, c]));
    setCustSearch("");
  };

  const submit = () => {
    if (!name.trim()) return toast.error("Donnez un nom à la campagne.");
    const payload: Record<string, unknown> = {};
    if (type === "GIFT") {
      if (!giftLabel.trim()) return toast.error("Le libellé du cadeau est requis.");
      payload.label = giftLabel.trim();
      if (giftImage.trim()) payload.image = giftImage.trim();
    } else if (type === "VOUCHER") {
      const a = Number(amount);
      if (!(a > 0)) return toast.error("Le montant du bon doit être positif.");
      payload.amount = a;
    } else if (type === "PROMO_CODE") {
      if (!promoCode) return toast.error("Choisissez un code promo.");
      payload.code = promoCode;
    }
    if (target === "ids" && selected.length === 0)
      return toast.error("Sélectionnez au moins un client.");
    if (scheduled && !scheduledAt)
      return toast.error("Choisissez la date d'envoi programmé.");

    createMut.mutate({
      name: name.trim(),
      type,
      payload,
      target_type: target,
      ...(target === "ids"
        ? { ids: selected.map((s) => s.id) }
        : level
        ? { loyalty_level: level }
        : {}),
      ...(scheduled && scheduledAt
        ? { scheduled_at: new Date(scheduledAt).toISOString() }
        : {}),
      ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Formulaire */}
      <div className="lg:col-span-3 bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
        <h2 className="text-[18px] font-semibold text-[#F17922] mb-5">
          Envoyer un cadeau
        </h2>

        {/* Type */}
        <Label>Type de récompense</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                  active
                    ? "border-[#F17922] bg-[#FFF6E9]"
                    : "border-[#E4E4E7] hover:bg-gray-50"
                }`}
              >
                <Icon size={18} className={active ? "text-[#F17922]" : "text-[#71717A]"} />
                <div className={`mt-1.5 text-sm font-semibold ${active ? "text-[#F17922]" : "text-[#18181B]"}`}>
                  {t.label}
                </div>
                <div className="text-[11px] text-[#9796A1] leading-tight mt-0.5">{t.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Nom */}
        <div className="mb-4">
          <Label>Nom de la campagne</Label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Cadeau de fin d'année"
          />
        </div>

        {/* Contenu selon le type */}
        {type === "GIFT" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <Label>Libellé du cadeau</Label>
              <input
                className={inputCls}
                value={giftLabel}
                onChange={(e) => setGiftLabel(e.target.value)}
                placeholder="Ex. Un dessert offert"
              />
            </div>
            <div>
              <Label>Image (URL, optionnel)</Label>
              <input
                className={inputCls}
                value={giftImage}
                onChange={(e) => setGiftImage(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
        )}
        {type === "VOUCHER" && (
          <div className="mb-4 max-w-xs">
            <Label>Montant du bon (FCFA)</Label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex. 2000"
            />
            <p className="text-[11px] text-[#9796A1] mt-1">
              Le bon d'achat est créé et crédité au moment où le client gratte.
            </p>
          </div>
        )}
        {type === "PROMO_CODE" && (
          <div className="mb-4 max-w-sm">
            <Label>Code promo</Label>
            <select
              className={inputCls}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            >
              <option value="">Choisir un code promo…</option>
              {(promos as { code: string; is_active?: boolean }[])
                .filter((p) => p.is_active !== false)
                .map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Destinataires */}
        <Label>Destinataires</Label>
        <div className="flex gap-2 mb-3">
          {(["all", "ids"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTarget(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer ${
                target === t
                  ? "border-[#F17922] bg-[#FFF6E9] text-[#F17922]"
                  : "border-[#E4E4E7] text-[#71717A] hover:bg-gray-50"
              }`}
            >
              {t === "all" ? "Tous les clients" : "Sélection"}
            </button>
          ))}
        </div>

        {target === "all" && (
          <div className="mb-4">
            <Label>Filtrer par niveau (optionnel)</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLevel("")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${
                  level === "" ? "border-[#F17922] bg-[#FFF6E9] text-[#F17922]" : "border-[#E4E4E7] text-[#71717A]"
                }`}
              >
                Tous niveaux
              </button>
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(l.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${
                    level === l.key ? "border-[#F17922] bg-[#FFF6E9] text-[#F17922]" : "border-[#E4E4E7] text-[#71717A]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {target === "ids" && (
          <div className="mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]" />
              <input
                className={`${inputCls} pl-9`}
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                placeholder="Rechercher un client (nom, téléphone)…"
              />
            </div>
            {custQuery.isFetching && (
              <div className="text-xs text-[#9796A1] mt-1">Recherche…</div>
            )}
            {custSearch.trim().length >= 2 && custQuery.data && (
              <div className="mt-1 border border-[#E4E4E7] rounded-lg divide-y divide-[#F1F3F5] max-h-52 overflow-y-auto">
                {(custQuery.data.data ?? []).map((c) => {
                  const label =
                    `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.phone || c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => addCustomer({ id: c.id, name: label })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#FFF6E9] cursor-pointer flex justify-between"
                    >
                      <span>{label}</span>
                      <span className="text-[#9796A1]">{c.phone}</span>
                    </button>
                  );
                })}
                {(custQuery.data.data ?? []).length === 0 && (
                  <div className="px-3 py-2 text-sm text-[#9796A1]">Aucun client</div>
                )}
              </div>
            )}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selected.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 bg-[#FFF6E9] text-[#7A3502] text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {s.name}
                    <button
                      type="button"
                      onClick={() => setSelected((p) => p.filter((x) => x.id !== s.id))}
                      className="cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Programmation + expiration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <Label>Envoi</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScheduled(false)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer ${
                  !scheduled ? "border-[#F17922] bg-[#FFF6E9] text-[#F17922]" : "border-[#E4E4E7] text-[#71717A]"
                }`}
              >
                Immédiat
              </button>
              <button
                type="button"
                onClick={() => setScheduled(true)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer ${
                  scheduled ? "border-[#F17922] bg-[#FFF6E9] text-[#F17922]" : "border-[#E4E4E7] text-[#71717A]"
                }`}
              >
                Programmé
              </button>
            </div>
            {scheduled && (
              <input
                type="datetime-local"
                className={`${inputCls} mt-2`}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            )}
          </div>
          <div>
            <Label>Expiration (optionnel)</Label>
            <input
              type="datetime-local"
              className={inputCls}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={createMut.isPending}
          className="w-full flex items-center justify-center gap-2 bg-[#F17922] text-white font-semibold py-3 rounded-lg hover:bg-[#e06816] disabled:opacity-60 cursor-pointer"
        >
          {createMut.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {scheduled ? "Programmer la campagne" : "Envoyer maintenant"}
        </button>
      </div>

      {/* Suivi */}
      <div className="lg:col-span-2 bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
        <h2 className="text-[18px] font-semibold text-[#F17922] mb-4">Suivi des campagnes</h2>
        {campaignsQuery.isLoading ? (
          <div className="text-sm text-[#9796A1]">Chargement…</div>
        ) : (campaignsQuery.data ?? []).length === 0 ? (
          <div className="text-sm text-[#9796A1]">Aucune campagne pour le moment.</div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto">
            {(campaignsQuery.data ?? []).map((c) => {
              const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.sent;
              return (
                <div key={c.id} className="border border-[#F1F3F5] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#18181B] truncate">{c.name}</div>
                      <div className="text-[11px] text-[#9796A1]">
                        {c.type === "GIFT" ? "Cadeau" : c.type === "VOUCHER" ? "Bon d'achat" : "Code promo"}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#71717A]">
                    <span>
                      Ciblés : <strong className="text-[#18181B]">{c.total_targeted}</strong>
                    </span>
                    <span>
                      Grattés : <strong className="text-[#F17922]">{c.scratched_count}</strong>
                    </span>
                  </div>
                  {c.status === "scheduled" && c.scheduled_at && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-[#2B6CB0]">
                        Prévu le {new Date(c.scheduled_at).toLocaleString("fr-FR")}
                      </span>
                      <button
                        type="button"
                        onClick={() => cancelMut.mutate(c.id)}
                        disabled={cancelMut.isPending}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C0392B] hover:underline cursor-pointer"
                      >
                        <Ban size={12} /> Annuler
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
