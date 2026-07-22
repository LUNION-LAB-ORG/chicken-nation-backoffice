"use client";

import React from "react";
import { Gift, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useDishListQuery } from "../../../../../features/menus/queries/dish-list.query";

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

const DEFAULT_ITEM: GiftItem = { type: "VOUCHER", payload: { amount: 1000 } };

/**
 * Éditeur d'un cadeau de parrainage : mode Fixe (toujours le 1er cadeau) ou
 * Aléatoire (tirage au sort parmi la liste). Types v1 : Bon d'achat, Plat offert.
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

  const items = value.items.length ? value.items : [DEFAULT_ITEM];
  const shown = value.mode === "FIXED" ? items.slice(0, 1) : items;

  const patchItem = (idx: number, patch: Partial<GiftItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...value, items: next });
  };
  const setType = (idx: number, type: GiftItem["type"]) => {
    patchItem(idx, {
      type,
      payload: type === "VOUCHER" ? { amount: 1000 } : { dish_id: dishes[0]?.id ?? "" },
    });
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
        {shown.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center"
          >
            <select
              value={item.type}
              onChange={(e) => setType(idx, e.target.value as GiftItem["type"])}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              aria-label="Type de cadeau"
            >
              <option value="VOUCHER">💳 Bon d'achat</option>
              <option value="GIFT">🍗 Plat offert</option>
            </select>

            {item.type === "VOUCHER" ? (
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
            ) : (
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
        ))}
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
