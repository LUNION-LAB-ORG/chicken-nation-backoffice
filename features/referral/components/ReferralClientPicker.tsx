"use client";

import React, { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useReferralClientsQuery } from "../queries/referral.queries";
import { ReferralClientCandidat } from "../types/referral.types";

/**
 * Recherche d'un client à faire parrain ou filleul. Un client qu'on ne peut
 * pas choisir reste affiché, grisé, avec la raison : sans cela on croirait
 * que la recherche ne l'a pas trouvé.
 */
export default function ReferralClientPicker({
  pour,
  onPick,
}: {
  pour: "parrain" | "filleul";
  onPick: (client: ReferralClientCandidat) => void;
}) {
  const [search, setSearch] = useState("");
  const { data, isFetching } = useReferralClientsQuery(search);

  const raison = (c: ReferralClientCandidat): string | null => {
    if (pour === "parrain") {
      return c.referral_code ? `Déjà parrain (${c.referral_code})` : null;
    }
    if (c.sponsor_code) return `Déjà filleul (${c.sponsor_code})`;
    if (c.has_paid_order) return "A déjà commandé";
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client (nom, téléphone)…"
          className="h-11 w-full rounded-lg border border-[#E4E4E7] pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
        />
        {isFetching && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#9796A1]" />
        )}
      </div>

      {search.trim().length >= 2 && data && (
        <ul className="max-h-64 overflow-auto rounded-lg border border-[#E4E4E7] divide-y divide-[#F2F2F4]">
          {data.length === 0 ? (
            <li className="px-3 py-3 text-sm text-[#9796A1]">Aucun client trouvé.</li>
          ) : (
            data.map((c) => {
              const bloque = raison(c);
              return (
                <li key={c.customer_id}>
                  <button
                    type="button"
                    disabled={!!bloque}
                    onClick={() => onPick(c)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#FFF6E9] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <span>
                      <span className="block text-sm font-medium text-[#18181B]">{c.fullname ?? "—"}</span>
                      <span className="block text-xs text-[#9796A1]">{c.phone ?? "—"}</span>
                    </span>
                    {bloque && <span className="text-xs text-[#71717A] whitespace-nowrap">{bloque}</span>}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
