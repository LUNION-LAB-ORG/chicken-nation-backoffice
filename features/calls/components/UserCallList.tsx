"use client";

import { useMemo, useState } from "react";
import { Phone, Search } from "lucide-react";
import { useStaffListQuery } from "../queries/staff-list.query";
import { useAuthStore } from "../../users/hook/authStore";
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
  const { data: users } = useStaffListQuery();
  const meId = useAuthStore((s) => s.user?.id);
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const all = (users ?? []).filter((u) => u.id !== meId);
    const term = q.trim().toLowerCase();
    return term ? all.filter((u) => u.fullname?.toLowerCase().includes(term)) : all;
  }, [users, meId, q]);

  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-6">
      <h3 className="font-semibold text-slate-800 mb-1">Appeler une personne</h3>
      <p className="text-sm text-slate-500 mb-4">
        Appel individuel (P2P) — sonne uniquement cette personne.
      </p>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une personne…"
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-auto">
        {list.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-700 truncate">{u.fullname}</div>
              <div className="text-xs text-slate-400 truncate">
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
              className="h-9 px-3 rounded-lg bg-[#F17922] hover:bg-[#e06a15] text-white text-sm flex items-center gap-1 disabled:opacity-50 shrink-0"
            >
              <Phone className="h-4 w-4" /> Appeler
            </button>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Aucune personne</p>
        )}
      </div>
    </section>
  );
}
