"use client";

import { useMemo, useState } from "react";
import { Phone, Search, Store } from "lucide-react";
import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";
import type { CallInvoker } from "../types/call.type";

export default function RestaurantCallList({
  call,
  disabled,
}: {
  call: CallInvoker;
  disabled: boolean;
}) {
  const { data, isLoading } = useRestaurantListQuery({ limit: 100 });
  const [q, setQ] = useState("");

  const restaurants = useMemo(() => {
    const list = (data?.data ?? []) as { id: string; name: string }[];
    const term = q.trim().toLowerCase();
    return term ? list.filter((r) => r.name.toLowerCase().includes(term)) : list;
  }, [data, q]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
        <Store className="h-4 w-4 text-slate-400" /> Appeler un restaurant
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Sonne chez les caissiers et managers du restaurant.
      </p>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher un restaurant" placeholder="Rechercher un restaurant…"
          className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#F17922]/40 focus:bg-white focus:ring-2 focus:ring-[#F17922]/20"
        />
      </div>

      <div className="max-h-96 space-y-2 overflow-auto">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
          ))}
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F17922]/10">
              <Store className="h-5 w-5 text-[#F17922]" />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
              {r.name}
            </span>
            <button
              type="button"
              onClick={() =>
                call({ targetKind: "RESTAURANT", restaurantId: r.id, targetLabel: r.name })
              }
              disabled={disabled}
              aria-label={`Appeler ${r.name}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-90 disabled:opacity-40"
            >
              <Phone className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!isLoading && restaurants.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">Aucun restaurant</p>
        )}
      </div>
    </section>
  );
}
