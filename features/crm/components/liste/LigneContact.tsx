import React from "react";
import { CreditCard, Phone } from "lucide-react";
import { IContactLigne } from "../../types/contact.type";
import { depuis, fmtDateHeure, fmtTelephone, origine } from "../../utils/crm-ui";
import { PuceCoupon, PucePublic, PuceStatut } from "../commun/Puces";

/** Une ligne du tableau (bureau). Le clic ouvre la fiche, la case ne l'ouvre pas. */
export function LigneContact({
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
    <tr onClick={onOuvrir} className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${coche ? "bg-orange-50/60" : ""}`}>
      {selectionnable && (
        <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={coche} onChange={onCocher} className="w-4 h-4 accent-[#F17922]" aria-label={`Sélectionner ${p.nom}`} />
        </td>
      )}
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-800">{p.nom}</p>
        <p className="text-xs text-gray-500 tabular-nums">{fmtTelephone(p.telephone)}</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <PucePublic segment={p.segment} />
        <p className="text-xs text-gray-400 mt-1">{origine(p)}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <PuceStatut statut={p.status} segment={p.segment} />
          {p.abandoned_orders > 0 && (
            <span title="A abandonné un paiement en ligne">
              <CreditCard className="w-3.5 h-3.5 text-rose-500" />
            </span>
          )}
        </div>
        {p.status === "A_RAPPELER" && p.callback_at && (
          <p className="text-xs text-amber-700 mt-1">Rappel {fmtDateHeure(p.callback_at)}</p>
        )}
      </td>
      <td className="px-4 py-3 text-gray-700">{p.assigned_to?.fullname ?? <span className="text-gray-400">Sans agent</span>}</td>
      <td className="px-4 py-3">
        {p.call_count === 0 ? (
          <span className="text-gray-400">Jamais appelé</span>
        ) : (
          <>
            <p className="text-gray-700 flex items-center gap-1">
              <Phone className="w-3 h-3 text-gray-400" />
              {p.last_call_status?.label ?? "Statut retiré"}
            </p>
            <p className="text-xs text-gray-400">
              {depuis(p.last_call_at)} · {p.call_count} tentative{p.call_count > 1 ? "s" : ""}
            </p>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate" title={p.loss_reason?.name}>
        {p.loss_reason?.name ?? ""}
      </td>
      <td className="px-4 py-3">
        <PuceCoupon etat={p.coupon?.etat ?? "AUCUN"} />
        {p.coupon && <p className="text-xs text-gray-500 font-mono mt-1">{p.coupon.code}</p>}
      </td>
      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{p.campaign?.name ?? <span className="text-gray-400">Hors campagne</span>}</td>
    </tr>
  );
}
