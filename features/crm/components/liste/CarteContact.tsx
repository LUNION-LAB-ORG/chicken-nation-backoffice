import React from "react";
import { ChevronRight, CreditCard } from "lucide-react";
import { IContactLigne } from "../../types/contact.type";
import { depuis, fmtTelephone, origine } from "../../utils/crm-ui";
import { PuceCoupon, PucePublic, PuceStatut } from "../commun/Puces";

/** Version téléphone d'une ligne : ce que l'agent a besoin de voir avant d'appeler. */
export function CarteContact({
  p,
  coche,
  onCocher,
  onOuvrir,
  selectionnable,
}: {
  p: IContactLigne;
  coche: boolean;
  onCocher: () => void;
  onOuvrir: () => void;
  selectionnable: boolean;
}) {
  return (
    <div
      onClick={onOuvrir}
      className={`flex items-start gap-3 bg-white border rounded-xl p-3 cursor-pointer ${coche ? "border-[#F17922] bg-orange-50/40" : "border-gray-200"}`}
    >
      {selectionnable && (
        <input
          type="checkbox"
          checked={coche}
          onClick={(e) => e.stopPropagation()}
          onChange={onCocher}
          className="mt-1 w-4 h-4 accent-[#F17922]"
          aria-label={`Sélectionner ${p.nom}`}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-800 truncate">{p.nom}</p>
          <PuceStatut statut={p.status} segment={p.segment} />
        </div>
        <p className="text-xs text-gray-500 tabular-nums">
          {fmtTelephone(p.customer.phone)} · {origine(p)}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-gray-500">
          <PucePublic segment={p.segment} />
          <span>{p.call_count === 0 ? "Jamais appelé" : `${p.call_count} appel${p.call_count > 1 ? "s" : ""}, ${depuis(p.last_call_at)}`}</span>
          {p.coupon && <PuceCoupon etat={p.coupon.etat} />}
          {p.abandoned_orders > 0 && (
            <span className="inline-flex items-center gap-1 text-rose-600">
              <CreditCard className="w-3 h-3" /> paiement abandonné
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
    </div>
  );
}
