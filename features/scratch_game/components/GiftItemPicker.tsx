"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { getAllDishes } from "../../menus/services/dish-service";
import {
  getAllSupplements,
  type Supplement,
} from "@/services/supplementService";
import { formatImageUrl } from "@/utils/imageHelpers";
import { money } from "../utils/scratch.utils";

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

export type GiftKind = "DISH" | "SUPPLEMENT";

/** Article offert normalisé (plat OU supplément). */
export interface PickedGift {
  kind: GiftKind;
  id: string;
  name: string;
  price: number;
  image: string | null;
}

interface GiftItemPickerProps {
  /** Article actuellement sélectionné (contrôlé). */
  value: PickedGift | null;
  onChange: (v: PickedGift | null) => void;
}

/**
 * Sélecteur d'article offert (plat OU supplément), calqué sur SendGiftManager.
 * Le cadeau peut être un menu/plat ou un supplément (boisson, sauce…) — offert
 * au panier à 0 fr dans l'app.
 */
export default function GiftItemPicker({ value, onChange }: GiftItemPickerProps) {
  const [kind, setKind] = useState<GiftKind>(value?.kind ?? "DISH");
  const [dishSearch, setDishSearch] = useState("");
  const [suppSearch, setSuppSearch] = useState("");

  const dishesQuery = useQuery({
    queryKey: ["dishes-all-gift"],
    queryFn: getAllDishes,
    enabled: kind === "DISH" && !value,
  });
  const suppsQuery = useQuery({
    queryKey: ["supplements-all-gift"],
    queryFn: getAllSupplements,
    enabled: kind === "SUPPLEMENT" && !value,
  });

  const dishes = useMemo(
    () =>
      ((dishesQuery.data ?? []) as PickedGift[])
        .filter((d) =>
          d.name.toLowerCase().includes(dishSearch.trim().toLowerCase())
        )
        .slice(0, 20),
    [dishesQuery.data, dishSearch]
  );

  const supps = useMemo(
    () =>
      Object.values(suppsQuery.data ?? {})
        .flat()
        .filter((s: Supplement) => s.available !== false)
        .filter((s: Supplement) =>
          s.name.toLowerCase().includes(suppSearch.trim().toLowerCase())
        )
        .slice(0, 20),
    [suppsQuery.data, suppSearch]
  );

  const switchKind = (next: GiftKind) => {
    setKind(next);
    onChange(null);
    setDishSearch("");
    setSuppSearch("");
  };

  return (
    <div>
      {/* Bascule Plat / Supplément */}
      <div className="mb-2 flex gap-2">
        {(
          [
            { key: "DISH", label: "🍗 Plat ou menu" },
            { key: "SUPPLEMENT", label: "🥤 Supplément" },
          ] as const
        ).map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => switchKind(k.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              kind === k.key
                ? "bg-[#F17922] text-white"
                : "bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Sélection courante */}
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-[#E4E4E7] p-2.5">
          {value.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formatImageUrl(value.image)}
              alt=""
              className="h-11 w-11 rounded-md object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[#18181B] truncate">
              {value.name}
            </div>
            <div className="text-[11px] text-[#9796A1]">
              {money(value.price)} → offert (0 fr)
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[#9796A1] hover:text-[#C0392B] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      ) : kind === "DISH" ? (
        <>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]"
            />
            <input
              className={`${inputCls} pl-9`}
              value={dishSearch}
              onChange={(e) => setDishSearch(e.target.value)}
              placeholder="Rechercher un plat…"
            />
          </div>
          {dishSearch.trim().length >= 1 && (
            <div className="mt-1 border border-[#E4E4E7] rounded-lg divide-y divide-[#F1F3F5] max-h-56 overflow-y-auto">
              {dishes.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[#9796A1]">
                  {dishesQuery.isLoading ? "Chargement…" : "Aucun plat"}
                </div>
              ) : (
                dishes.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        kind: "DISH",
                        id: d.id,
                        name: d.name,
                        price: d.price,
                        image: d.image,
                      });
                      setDishSearch("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#FFF6E9] cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{d.name}</span>
                    <span className="text-[#9796A1] shrink-0">
                      {money(d.price)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]"
            />
            <input
              className={`${inputCls} pl-9`}
              value={suppSearch}
              onChange={(e) => setSuppSearch(e.target.value)}
              placeholder="Rechercher un supplément…"
            />
          </div>
          {suppSearch.trim().length >= 1 && (
            <div className="mt-1 border border-[#E4E4E7] rounded-lg divide-y divide-[#F1F3F5] max-h-56 overflow-y-auto">
              {supps.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[#9796A1]">
                  {suppsQuery.isLoading ? "Chargement…" : "Aucun supplément"}
                </div>
              ) : (
                supps.map((s: Supplement) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        kind: "SUPPLEMENT",
                        id: s.id,
                        name: s.name,
                        price: s.price,
                        image: s.image ?? null,
                      });
                      setSuppSearch("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#FFF6E9] cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[#9796A1] shrink-0">
                      {money(s.price)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
