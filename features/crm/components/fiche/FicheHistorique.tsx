import React, { useState } from "react";
import { History, PhoneCall } from "lucide-react";
import { IContactFiche } from "../../types/contact.type";
import { EFFET_META, fmtDateHeure } from "../../utils/crm-ui";
import { Puce } from "../commun/Puces";

/** Appels passés et journal horodaté de toute action (cahier §4.3 et §10). */
export function FicheHistorique({ p }: { p: IContactFiche }) {
  const [vue, setVue] = useState<"appels" | "journal">("appels");

  return (
    <div className="border border-gray-100 rounded-xl">
      <div className="flex items-center gap-1 border-b border-gray-100 p-1.5">
        {(
          [
            ["appels", `Appels (${p.appels.length})`, PhoneCall],
            ["journal", "Journal", History],
          ] as const
        ).map(([cle, label, Icone]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setVue(cle)}
            className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg ${
              vue === cle ? "bg-orange-50 text-[#F17922]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icone className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="max-h-80 overflow-y-auto p-4">
        {vue === "appels" ? (
          p.appels.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun appel pour l&apos;instant.</p>
          ) : (
            <ol className="space-y-3">
              {p.appels.map((a) => (
                <li key={a.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400 tabular-nums">{fmtDateHeure(a.created_at)}</span>
                    <Puce label={a.status_label} className={EFFET_META[a.outcome].className} />
                    <span className="text-xs text-gray-500">
                      n° {a.attempt} · {a.agent?.fullname ?? "compte supprimé"}
                      {a.campaign && ` · ${a.campaign.name}`}
                    </span>
                  </div>
                  {a.loss_reason && <p className="text-xs text-rose-700 mt-1">Raison : {a.loss_reason.name}</p>}
                  {a.callback_at && <p className="text-xs text-amber-700 mt-1">Rappel prévu {fmtDateHeure(a.callback_at)}</p>}
                  {a.comment && <p className="text-gray-700 mt-1 whitespace-pre-line">« {a.comment} »</p>}
                </li>
              ))}
            </ol>
          )
        ) : (
          <ol className="space-y-2">
            {p.journal.map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap pt-0.5">{fmtDateHeure(e.created_at)}</span>
                <span className="text-gray-700">
                  {e.label}
                  <span className="text-xs text-gray-400"> · {e.actor?.fullname ?? "système"}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
