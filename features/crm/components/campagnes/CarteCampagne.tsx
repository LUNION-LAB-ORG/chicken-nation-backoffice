import React from "react";
import { CalendarDays, ChevronRight, UserRound } from "lucide-react";
import { ICampagne } from "../../types/campagne.type";
import { Public } from "../../types/contact.type";
import { PUBLICS, accord, fmtDate, fmtNombre } from "../../utils/crm-ui";
import { PuceCampagne, PucePublic } from "../commun/Puces";

function Barre({ valeur, total }: { valeur: number; total: number }) {
  const part = total > 0 ? Math.min(100, Math.round((valeur / total) * 100)) : 0;
  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full bg-[#F17922] rounded-full" style={{ width: `${part}%` }} />
    </div>
  );
}

/** Publics visés, dans l'ordre du CRM ; repli sur l'ancienne liste `segments`. */
export const publicsVises = (c: Pick<ICampagne, "publics" | "segments">): Public[] => {
  const liste = c.publics?.length ? c.publics.map((p) => p.segment) : (c.segments ?? []);
  return PUBLICS.filter((p) => liste.includes(p));
};

/** Une campagne en un coup d'œil : où elle en est, qui la mène, ce qu'elle a converti, public par public. */
export function CarteCampagne({ c, onOuvrir }: { c: ICampagne; onOuvrir: () => void }) {
  const r = c.resume ?? { cibles: 0, traites: 0, conversions: 0, coupons: 0 };
  const parPublic = [...(r.par_public ?? [])].sort((a, b) => PUBLICS.indexOf(a.segment) - PUBLICS.indexOf(b.segment));
  const publics = publicsVises(c);

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
            {c.end_date ? `${fmtDate(c.start_date)} au ${fmtDate(c.end_date)}` : `depuis le ${fmtDate(c.start_date)}, sans fin prévue`}
          </p>
        </div>
        <PuceCampagne statut={c.status} />
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {publics.map((s) => (
          <PucePublic key={s} segment={s} />
        ))}
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1 mt-3">
        <UserRound className="w-3.5 h-3.5" /> Pilote : {c.lead_agent.fullname} · {c.assigned_agents.length}{" "}
        {accord(c.assigned_agents.length, "agent")}
      </p>

      {c.status === "PLANIFIED" ? (
        <p className="text-sm text-gray-500 mt-3">Pas encore lancée.</p>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>
              {fmtNombre(r.traites)} {accord(r.traites, "traité")} sur {fmtNombre(r.cibles)}
            </span>
            <span className="font-semibold text-emerald-700">
              {fmtNombre(r.conversions)} {accord(r.conversions, "vente")}
            </span>
          </div>
          <Barre valeur={r.traites} total={r.cibles} />
          {parPublic.length > 1 && (
            <ul className="pt-1 space-y-1">
              {parPublic.map((p) => (
                <li key={p.segment} className="flex items-center justify-between gap-2 text-xs text-gray-600">
                  <PucePublic segment={p.segment} />
                  <span className="tabular-nums text-right">
                    {fmtNombre(p.traites)} / {fmtNombre(p.cibles)} {accord(p.traites, "traité")} ·{" "}
                    <span className="font-semibold text-emerald-700">
                      {fmtNombre(p.conversions)} {accord(p.conversions, "vente")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs font-semibold text-[#F17922] mt-3 flex items-center gap-1">
        Tableau de bord <ChevronRight className="w-3.5 h-3.5" />
      </p>
    </button>
  );
}
