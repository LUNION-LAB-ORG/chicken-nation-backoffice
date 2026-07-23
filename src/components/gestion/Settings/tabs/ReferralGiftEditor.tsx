"use client";

import React from "react";
import { Gift, Plus, Trash2, UtensilsCrossed, CupSoda } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDishListQuery } from "../../../../../features/menus/queries/dish-list.query";
import { getAllSupplements, Supplement } from "@/services/supplementService";

/** Un cadeau possible du parrainage (carte à gratter). */
export interface GiftItem {
  type: "VOUCHER" | "GIFT";
  payload: Record<string, any>;
  expires_in_days?: number;
}
export interface GiftConfig {
  mode: "FIXED" | "RANDOM";
  items: GiftItem[];
}

/**
 * « Genre » d'un item côté UI. En données, un cadeau GIFT est discriminé par
 * son payload : { dish_id } = plat/menu offert, { supplement_id } = supplément
 * offert (même contrat que le backend enrichGiftItems / validateGiftLines).
 */
type ItemKind = "VOUCHER" | "GIFT_DISH" | "GIFT_SUPPLEMENT";

const kindOf = (item: GiftItem): ItemKind => {
  if (item.type === "VOUCHER") return "VOUCHER";
  return item.payload?.supplement_id ? "GIFT_SUPPLEMENT" : "GIFT_DISH";
};

const DEFAULT_ITEM: GiftItem = { type: "VOUCHER", payload: { amount: 1000 } };

/**
 * Éditeur d'un cadeau de parrainage : mode Fixe (toujours le 1er cadeau) ou
 * Aléatoire (tirage au sort). Types : Bon d'achat, Plat/menu offert, Supplément offert.
 */
export default function ReferralGiftEditor({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: GiftConfig;
  onChange: (next: GiftConfig) => void;
}) {
  const { data: dishesResp } = useDishListQuery();
  const dishes = ((dishesResp as any)?.data ?? dishesResp ?? []) as {
    id: string;
    name: string;
  }[];

  // Suppléments groupés par catégorie (FOOD/DRINK/ACCESSORY) → liste plate.
  const { data: suppGroups } = useQuery({
    queryKey: ["supplements", "all"],
    queryFn: getAllSupplements,
    staleTime: 5 * 60 * 1000,
  });
  const supplements: Supplement[] = React.useMemo(
    () => Object.values(suppGroups ?? {}).flat().filter((s) => s.available !== false),
    [suppGroups],
  );

  const items = value.items.length ? value.items : [DEFAULT_ITEM];
  const shown = value.mode === "FIXED" ? items.slice(0, 1) : items;

  const patchItem = (idx: number, patch: Partial<GiftItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...value, items: next });
  };
  const setKind = (idx: number, kind: ItemKind) => {
    if (kind === "VOUCHER") {
      patchItem(idx, { type: "VOUCHER", payload: { amount: 1000 } });
    } else if (kind === "GIFT_DISH") {
      patchItem(idx, { type: "GIFT", payload: { dish_id: dishes[0]?.id ?? "" } });
    } else {
      patchItem(idx, { type: "GIFT", payload: { supplement_id: supplements[0]?.id ?? "" } });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 p-5">
      <h4 className="flex items-center gap-2 font-semibold text-slate-800">
        <Gift className="h-4 w-4 text-[#F17922]" /> {title}
      </h4>
      <p className="mb-4 mt-1 text-sm text-slate-500">{subtitle}</p>

      {/* Mode */}
      <div className="mb-4 flex gap-2">
        {(
          [
            { key: "FIXED", label: "Cadeau fixe" },
            { key: "RANDOM", label: "Aléatoire (tirage au sort)" },
          ] as const
        ).map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange({ ...value, mode: m.key, items })}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              value.mode === m.key
                ? "bg-[#F17922] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {shown.map((item, idx) => {
          const kind = kindOf(item);
          return (
            <div
              key={idx}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center"
            >
              <select
                value={kind}
                onChange={(e) => setKind(idx, e.target.value as ItemKind)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                aria-label="Type de cadeau"
              >
                <option value="VOUCHER">💳 Bon d'achat</option>
                <option value="GIFT_DISH">🍗 Plat ou menu offert</option>
                <option value="GIFT_SUPPLEMENT">🥤 Supplément offert</option>
              </select>

              {kind === "VOUCHER" && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={item.payload.amount ?? 0}
                    onChange={(e) =>
                      patchItem(idx, { payload: { amount: Number(e.target.value) } })
                    }
                    className="h-10 w-32 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    aria-label="Montant du bon (FCFA)"
                  />
                  <span className="text-sm text-slate-500">FCFA</span>
                </div>
              )}

              {kind === "GIFT_DISH" && (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 shrink-0 text-slate-400" />
                  <select
                    value={item.payload.dish_id ?? ""}
                    onChange={(e) => patchItem(idx, { payload: { dish_id: e.target.value } })}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    aria-label="Plat offert"
                  >
                    <option value="">— Choisir un plat —</option>
                    {dishes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {kind === "GIFT_SUPPLEMENT" && (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <CupSoda className="h-4 w-4 shrink-0 text-slate-400" />
                  <select
                    value={item.payload.supplement_id ?? ""}
                    onChange={(e) =>
                      patchItem(idx, { payload: { supplement_id: e.target.value } })
                    }
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    aria-label="Supplément offert"
                  >
                    <option value="">— Choisir un supplément —</option>
                    {supplements.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.price} F)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 sm:ml-auto">
                <input
                  type="number"
                  min={0}
                  value={item.expires_in_days ?? 0}
                  onChange={(e) =>
                    patchItem(idx, {
                      expires_in_days: Number(e.target.value) > 0 ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-10 w-20 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  aria-label="Expiration (jours, 0 = jamais)"
                  title="Expiration (jours, 0 = jamais)"
                />
                <span className="text-xs text-slate-500">j</span>
                {value.mode === "RANDOM" && shown.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...value, items: items.filter((_, i) => i !== idx) })
                    }
                    aria-label="Supprimer ce cadeau"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {value.mode === "RANDOM" && (
        <button
          type="button"
          onClick={() => onChange({ ...value, items: [...items, { ...DEFAULT_ITEM }] })}
          className="mt-3 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" /> Ajouter un cadeau au tirage
        </button>
      )}
    </div>
  );
}
