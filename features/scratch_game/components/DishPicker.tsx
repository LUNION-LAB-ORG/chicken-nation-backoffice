"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { getAllDishes } from "../../menus/services/dish-service";
import { formatImageUrl } from "@/utils/imageHelpers";
import { money } from "../utils/scratch.utils";

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

export interface PickedDish {
  id: string;
  name: string;
  price: number;
  image: string | null;
}

interface DishPickerProps {
  /** Plat actuellement sélectionné (contrôlé). */
  value: PickedDish | null;
  onChange: (dish: PickedDish | null) => void;
}

/**
 * Sélecteur de plat réutilisable (recherche + liste), calqué sur SendGiftManager.
 * Utilise le service menus/getAllDishes.
 */
export default function DishPicker({ value, onChange }: DishPickerProps) {
  const [search, setSearch] = useState("");

  const dishesQuery = useQuery({
    queryKey: ["dishes-all-scratch"],
    queryFn: getAllDishes,
  });

  const dishes = ((dishesQuery.data ?? []) as PickedDish[])
    .filter((d) => d.name.toLowerCase().includes(search.trim().toLowerCase()))
    .slice(0, 20);

  if (value) {
    return (
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
    );
  }

  return (
    <>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]"
        />
        <input
          className={`${inputCls} pl-9`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un plat…"
        />
      </div>
      {search.trim().length >= 1 && (
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
                    id: d.id,
                    name: d.name,
                    price: d.price,
                    image: d.image,
                  });
                  setSearch("");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#FFF6E9] cursor-pointer flex items-center justify-between gap-2"
              >
                <span className="truncate">{d.name}</span>
                <span className="text-[#9796A1] shrink-0">{money(d.price)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </>
  );
}
