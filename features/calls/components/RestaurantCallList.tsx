"use client";

import { useMemo, useState } from "react";
import { Phone, Search } from "lucide-react";
import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";

export default function RestaurantCallList({
  call,
  disabled,
}: {
  call: (a: { restaurantId?: string; targetLabel: string }) => void;
  disabled: boolean;
}) {
  const { data } = useRestaurantListQuery();
  const [q, setQ] = useState("");

  const restaurants = useMemo(() => {
    const list = (data?.data ?? []) as { id: string; name: string }[];
    const term = q.trim().toLowerCase();
    return term ? list.filter((r) => r.name.toLowerCase().includes(term)) : list;
  }, [data, q]);

  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-6">
      <h3 className="font-semibold text-slate-800 mb-1">Appeler un restaurant</h3>
      <p className="text-sm text-slate-500 mb-4">
        L&apos;appel sonne chez les caissiers et managers du restaurant.
      </p>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un restaurant…"
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-auto">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
          >
            <span className="text-sm font-medium text-slate-700 truncate">{r.name}</span>
            <button
              type="button"
              onClick={() => call({ restaurantId: r.id, targetLabel: r.name })}
              disabled={disabled}
              className="h-9 px-3 rounded-lg bg-[#F17922] hover:bg-[#e06a15] text-white text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <Phone className="h-4 w-4" /> Appeler
            </button>
          </div>
        ))}
        {restaurants.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Aucun restaurant</p>
        )}
      </div>
    </section>
  );
}
