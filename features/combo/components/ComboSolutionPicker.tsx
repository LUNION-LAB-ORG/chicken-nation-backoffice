"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Minus, Plus } from "lucide-react";
import { getAllDishes } from "../../menus/services/dish-service";
import { getAllSupplements } from "@/services/supplementService";
import { Dish } from "../../menus/types/dish.types";
import { ComboSolutionItem } from "../types/combo.types";
import { ITEM_TYPE_BADGE, ITEM_TYPE_LABEL, money } from "../utils/combo.utils";

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

interface MenuOption {
  item_type: "DISH" | "SUPPLEMENT";
  item_id: string;
  name: string;
  price: number;
}

interface ComboSolutionPickerProps {
  /** Items de la solution (contrôlé). */
  value: ComboSolutionItem[];
  onChange: (items: ComboSolutionItem[]) => void;
}

/**
 * Sélecteur de la combinaison-solution : plats ET suppléments du MENU RÉEL.
 * Recherche unifiée + liste des items retenus (avec quantité). Calqué sur le
 * DishPicker de scratch_game, étendu aux suppléments.
 */
export default function ComboSolutionPicker({
  value,
  onChange,
}: ComboSolutionPickerProps) {
  const [search, setSearch] = useState("");

  const dishesQuery = useQuery({
    queryKey: ["dishes-all-combo"],
    queryFn: getAllDishes,
  });
  const supplementsQuery = useQuery({
    queryKey: ["supplements-all-combo"],
    queryFn: getAllSupplements,
  });

  const options = useMemo<MenuOption[]>(() => {
    const dishes = ((dishesQuery.data ?? []) as Dish[]).map((d) => ({
      item_type: "DISH" as const,
      item_id: d.id,
      name: d.name,
      price: d.price,
    }));
    // getAllSupplements renvoie { FOOD: [], DRINK: [], ACCESSORY: [] }
    const supMap = (supplementsQuery.data ?? {}) as Record<
      string,
      { id: string; name: string; price: number }[]
    >;
    const supplements = Object.values(supMap)
      .flat()
      .map((s) => ({
        item_type: "SUPPLEMENT" as const,
        item_id: s.id,
        name: s.name,
        price: s.price,
      }));
    return [...dishes, ...supplements];
  }, [dishesQuery.data, supplementsQuery.data]);

  const selectedKeys = useMemo(
    () => new Set(value.map((it) => `${it.item_type}:${it.item_id}`)),
    [value]
  );

  const results = options
    .filter(
      (o) =>
        !selectedKeys.has(`${o.item_type}:${o.item_id}`) &&
        o.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    .slice(0, 20);

  const add = (o: MenuOption) => {
    onChange([
      ...value,
      {
        item_type: o.item_type,
        item_id: o.item_id,
        name: o.name,
        quantity: 1,
      },
    ]);
    setSearch("");
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const setQty = (index: number, qty: number) => {
    const next = value.map((it, i) =>
      i === index ? { ...it, quantity: Math.max(1, qty) } : it
    );
    onChange(next);
  };

  const isLoading = dishesQuery.isLoading || supplementsQuery.isLoading;

  return (
    <div className="space-y-3">
      {/* Items retenus */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((it, index) => (
            <div
              key={`${it.item_type}:${it.item_id}`}
              className="flex items-center gap-3 rounded-lg border border-[#E4E4E7] p-2.5"
            >
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  ITEM_TYPE_BADGE[it.item_type]
                }`}
              >
                {ITEM_TYPE_LABEL[it.item_type]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#18181B] truncate">
                  {it.name || it.item_id}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setQty(index, (it.quantity ?? 1) - 1)}
                  className="p-1 rounded-md text-[#71717A] hover:bg-[#F1F3F5] cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-medium">
                  {it.quantity ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(index, (it.quantity ?? 1) + 1)}
                  className="p-1 rounded-md text-[#71717A] hover:bg-[#F1F3F5] cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-[#9796A1] hover:text-[#C0392B] cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recherche + ajout */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]"
        />
        <input
          className={`${inputCls} pl-9`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ajouter un plat ou un supplément du menu…"
        />
      </div>
      {search.trim().length >= 1 && (
        <div className="mt-1 border border-[#E4E4E7] rounded-lg divide-y divide-[#F1F3F5] max-h-56 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#9796A1]">
              {isLoading ? "Chargement…" : "Aucun item"}
            </div>
          ) : (
            results.map((o) => (
              <button
                key={`${o.item_type}:${o.item_id}`}
                type="button"
                onClick={() => add(o)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#FFF6E9] cursor-pointer flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                      ITEM_TYPE_BADGE[o.item_type]
                    }`}
                  >
                    {ITEM_TYPE_LABEL[o.item_type]}
                  </span>
                  <span className="truncate">{o.name}</span>
                </span>
                <span className="text-[#9796A1] shrink-0">
                  {money(o.price)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
