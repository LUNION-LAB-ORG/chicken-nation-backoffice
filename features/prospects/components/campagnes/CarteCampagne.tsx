import React from "react";
import { CalendarDays, ChevronRight, UserRound } from "lucide-react";
import { ICampagne } from "../../types/campagne.type";
import { fmtDate, fmtNombre } from "../../utils/prospect-ui";
import { PuceCampagne } from "../commun/Puces";

function Barre({ valeur, total }: { valeur: number; total: number }) {
  const part = total > 0 ? Math.min(100, Math.round((valeur / total) * 100)) : 0;
  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full bg-[#F17922] rounded-full" style={{ width: `${part}%` }} />
    </div>
  );
}

/** Une campagne en un coup d'œil : où elle en est, qui la mène, ce qu'elle a converti. */
export function CarteCampagne({ c, onOuvrir }: { c: ICampagne; onOuvrir: () => void }) {
  const r = c.resume ?? { cibles: 0, traites: 0, conversions: 0, coupons: 0 };
  return (
    <button
      type="button"
      onClick={onOuvrir}
      className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#F17922] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{c.name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {fmtDate(c.start_date)} au {c.end_date ? fmtDate(c.end_date) : "sans fin prévue"}
          </p>
        </div>
        <PuceCampagne statut={c.status} />
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1 mt-3">
        <UserRound className="w-3.5 h-3.5" /> Pilote : {c.lead_agent.fullname} · {c.assigned_agents.length} agent
        {c.assigned_agents.length > 1 ? "s" : ""}
      </p>

      {c.status === "PLANIFIED" ? (
        <p className="text-sm text-gray-500 mt-3">Pas encore lancée.</p>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>
              {fmtNombre(r.traites)} traités sur {fmtNombre(r.cibles)}
            </span>
            <span className="font-semibold text-emerald-700">{fmtNombre(r.conversions)} conversions</span>
          </div>
          <Barre valeur={r.traites} total={r.cibles} />
        </div>
      )}

      <p className="text-xs font-semibold text-[#F17922] mt-3 flex items-center gap-1">
        Tableau de bord <ChevronRight className="w-3.5 h-3.5" />
      </p>
    </button>
  );
}
