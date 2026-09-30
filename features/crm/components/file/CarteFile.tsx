import React from "react";
import { CreditCard, Megaphone, Phone } from "lucide-react";
import { usePrendreMutation } from "../../queries/contact.mutation";
import { IContactLigne } from "../../types/contact.type";
import { depuis, fmtDate, fmtDateHeure, fmtTelephone, lienAppel, origine } from "../../utils/crm-ui";
import { PucePublic, PuceStatut } from "../commun/Puces";

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Une carte de la file : tout ce qu'il faut pour appeler, sans ouvrir la fiche.
 *
 * Dans la file commune Glovo/Yango, composer le numéro PREND d'abord le
 * client : si un collègue a été plus rapide, le numéro n'est pas composé et
 * la file se rafraîchit.
 */
export function CarteFile({ p, onOuvrir, commune = false }: { p: IContactLigne; onOuvrir: () => void; commune?: boolean }) {
  const prendre = usePrendreMutation();
  const contexte =
    p.status === "A_RAPPELER" && p.callback_at
      ? `Rappel promis ${fmtDateHeure(p.callback_at)}`
      : p.status === "COUPON_ENVOYE" && p.coupon
        ? `Coupon ${p.coupon.code}, valable jusqu'au ${fmtDate(p.coupon.expires_at)}`
        : p.call_count > 0
          ? `${p.call_count} tentative${p.call_count > 1 ? "s" : ""}, dernier appel ${depuis(p.last_call_at)}${p.last_call_status ? ` (${p.last_call_status.label.toLowerCase()})` : ""}`
          : `${majuscule(origine(p))}, jamais appelé`;

  const classeAppel =
    "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-[#F17922] text-white px-3 py-2 text-sm font-semibold hover:bg-[#e06a15] disabled:opacity-60";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <button type="button" onClick={onOuvrir} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 truncate">{p.nom}</p>
          <PucePublic segment={p.segment} />
          <PuceStatut statut={p.status} segment={p.segment} />
          {/*
            HORS CAMPAGNE DOIT SE VOIR. La campagne n'était affichée qu'en gris
            minuscule sur la troisième ligne, et un contact sans campagne
            n'affichait rien du tout : l'absence de pastille n'est pas un
            signal, on ne distingue pas « pas de campagne » de « je n'ai pas
            regardé ». D'où une pastille dans les deux cas, à hauteur d'œil.
            Sauf dans la file commune, où personne n'a encore de campagne et
            où la mention serait un bruit répété cinquante fois.
          */}
          {!commune &&
            (p.campaign ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F17922]/40 bg-[#FDF3E7] px-2 py-0.5 text-[11px] font-semibold text-[#8A4B00]">
                <Megaphone className="w-3 h-3" /> {p.campaign.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                Hors campagne
              </span>
            ))}
          {p.abandoned_orders > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-600">
              <CreditCard className="w-3 h-3" /> paiement abandonné
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{contexte}</p>
        {(p.last_comment || p.loss_reason) && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            {p.loss_reason && <span className="text-rose-600 mr-2">Raison : {p.loss_reason.name}</span>}
            {p.last_comment && `« ${p.last_comment} »`}
          </p>
        )}
      </button>
      <div className="flex gap-2 shrink-0">
        {commune ? (
          <button
            type="button"
            disabled={prendre.isPending}
            onClick={() =>
              prendre.mutate(p.id, {
                onSuccess: () => {
                  window.location.href = lienAppel(p.telephone);
                },
              })
            }
            className={classeAppel}
            title="Le client devient le vôtre, puis le numéro est composé"
          >
            <Phone className="w-4 h-4" /> {prendre.isPending ? "Un instant…" : `Prendre et appeler ${fmtTelephone(p.telephone)}`}
          </button>
        ) : (
          <a href={lienAppel(p.telephone)} className={classeAppel}>
            <Phone className="w-4 h-4" /> {fmtTelephone(p.telephone)}
          </a>
        )}
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
