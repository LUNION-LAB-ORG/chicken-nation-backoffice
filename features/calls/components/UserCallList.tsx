"use client";

import { useMemo, useState } from "react";
import { Phone, Search, Users } from "lucide-react";
import { useStaffListQuery } from "../queries/staff-list.query";
import { useAuthStore } from "../../users/hook/authStore";
import { getInitials } from "../utils/initials";
import type { CallInvoker } from "../types/call.type";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MARKETING: "Marketing",
  COMPTABLE: "Comptable",
  CALL_CENTER: "Call center",
  MANAGER: "Manager",
  ASSISTANT_MANAGER: "Assistant manager",
  CAISSIER: "Caissier",
  CUISINE: "Cuisine",
};

export default function UserCallList({
  call,
  disabled,
}: {
  call: CallInvoker;
  disabled: boolean;
}) {
  const { data: users, isLoading } = useStaffListQuery();
  const meId = useAuthStore((s) => s.user?.id);
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const all = (users ?? []).filter((u) => u.id !== meId);
    const term = q.trim().toLowerCase();
    return term ? all.filter((u) => u.fullname?.toLowerCase().includes(term)) : all;
  }, [users, meId, q]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
        <Users className="h-4 w-4 text-slate-400" /> Appeler une personne
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Appel individuel — sonne uniquement cette personne.
      </p>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher une personne" placeholder="Rechercher une personne…"
          className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#F17922]/40 focus:bg-white focus:ring-2 focus:ring-[#F17922]/20"
        />
      </div>

      <div className="max-h-96 space-y-2 overflow-auto">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
          ))}
        {list.map((u) => (
          <div
            key={u.id}
            className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              {getInitials(u.fullname)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-700">{u.fullname}</div>
              <div className="truncate text-xs text-slate-400">
                {ROLE_LABELS[u.role] ?? u.role}
                {u.restaurant?.name ? ` · ${u.restaurant.name}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                call({ targetKind: "USER", targetUserId: u.id, targetLabel: u.fullname })
              }
              disabled={disabled}
              aria-label={`Appeler ${u.fullname}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-90 disabled:opacity-40"
            >
              <Phone className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!isLoading && list.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">Aucune personne</p>
        )}
      </div>
    </section>
  );
}
