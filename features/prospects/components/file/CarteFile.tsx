import React from "react";
import { CreditCard, Megaphone, Phone } from "lucide-react";
import { IProspectLigne } from "../../types/prospect.type";
import { depuis, fmtDate, fmtDateHeure, fmtTelephone, lienAppel } from "../../utils/prospect-ui";
import { PuceStatut } from "../commun/Puces";

/** Une carte de la file : tout ce qu'il faut pour appeler, sans ouvrir la fiche. */
export function CarteFile({ p, onOuvrir }: { p: IProspectLigne; onOuvrir: () => void }) {
  const contexte =
    p.status === "A_RAPPELER" && p.callback_at
      ? `Rappel promis ${fmtDateHeure(p.callback_at)}`
      : p.status === "COUPON_ENVOYE" && p.coupon
        ? `Coupon ${p.coupon.code}, valable jusqu'au ${fmtDate(p.coupon.expires_at)}`
        : p.call_count > 0
          ? `${p.call_count} tentative${p.call_count > 1 ? "s" : ""}, dernier appel ${depuis(p.last_call_at)}${p.last_call_status ? ` (${p.last_call_status.label.toLowerCase()})` : ""}`
          : `Inscrit ${depuis(p.registered_at)}, jamais appelé`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <button type="button" onClick={onOuvrir} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 truncate">{p.nom}</p>
          <PuceStatut statut={p.status} />
          {p.abandoned_orders > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-600">
              <CreditCard className="w-3 h-3" /> paiement abandonné
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{contexte}</p>
        {(p.last_comment || p.campaign) && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            {p.campaign && (
              <span className="inline-flex items-center gap-1 mr-2">
                <Megaphone className="w-3 h-3" /> {p.campaign.name}
              </span>
            )}
            {p.last_comment && `« ${p.last_comment} »`}
          </p>
        )}
      </button>
      <div className="flex gap-2 shrink-0">
        <a
          href={lienAppel(p.customer.phone)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-[#F17922] text-white px-3 py-2 text-sm font-semibold hover:bg-[#e06a15]"
        >
          <Phone className="w-4 h-4" /> {fmtTelephone(p.customer.phone)}
        </a>
        <button
          type="button"
          onClick={onOuvrir}
          className="flex-1 sm:flex-none rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Qualifier
        </button>
      </div>
    </div>
  );
}
