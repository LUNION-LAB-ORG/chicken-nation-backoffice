import React, { useState } from "react";
import { Copy, RotateCw, Send, Ticket } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCouponMutation, useRenvoyerCouponMutation } from "../../queries/prospect.mutation";
import { useOffresQuery } from "../../queries/reglage.query";
import { IProspectFiche } from "../../types/prospect.type";
import { CANAL_LABEL, fmtDate } from "../../utils/prospect-ui";
import { Bouton, ChampSelect } from "../commun/Champs";

/**
 * Coupon de bienvenue (cahier §4.3 et §8). Un seul coupon actif à la fois :
 * tant qu'il vit, on le renvoie au lieu d'en créer un second.
 */
export function PanneauCoupon({ p }: { p: IProspectFiche }) {
  const { data: offres = [] } = useOffresQuery();
  const envoyer = useCouponMutation();
  const renvoyer = useRenvoyerCouponMutation();
  const [offreId, setOffreId] = useState("");
  const [message, setMessage] = useState<{ texte: string; parti: boolean } | null>(null);

  const actif = p.coupons.find((c) => c.etat === "ACTIF");
  const bloque = p.status === "INJOIGNABLE";

  const copier = (texte: string) => navigator.clipboard?.writeText(texte).then(() => toast.success("Copié"));

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <Ticket className="w-4 h-4 text-[#F17922]" /> Coupon
      </p>

      {actif ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-lg font-bold tracking-wider text-[#C2410C]">{actif.code}</p>
            <button type="button" onClick={() => copier(actif.code)} className="p-1.5 rounded hover:bg-white" aria-label="Copier le code">
              <Copy className="w-4 h-4 text-[#C2410C]" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {actif.offer_label} · jusqu&apos;au {fmtDate(actif.expires_at)} · {CANAL_LABEL[actif.channel]}
            {actif.resent_count > 0 && ` · renvoyé ${actif.resent_count} fois`}
          </p>
          {actif.send_error && <p className="text-xs text-rose-700 mt-1">{actif.send_error}</p>}
          <Bouton
            className="w-full mt-3"
            desactive={renvoyer.isPending}
            onClick={() => renvoyer.mutate(p.id, { onSuccess: (r) => setMessage({ texte: r.message, parti: r.envoye }) })}
          >
            <RotateCw className="w-4 h-4" /> Renvoyer le message
          </Bouton>
        </div>
      ) : (
        <>
          <ChampSelect
            label="Offre"
            valeur={offreId}
            onChange={setOffreId}
            vide="Offre de la campagne ou par défaut"
            options={offres.filter((o) => o.is_active).map((o) => ({ value: o.id, label: `${o.label} (${o.validity_days} j)` }))}
          />
          <Bouton
            variante={p.status === "INTERESSE" ? "primaire" : "secondaire"}
            className="w-full"
            desactive={bloque || envoyer.isPending}
            onClick={() =>
              envoyer.mutate({ id: p.id, offreId: offreId || undefined }, { onSuccess: (r) => setMessage({ texte: r.message, parti: r.envoye }) })
            }
          >
            <Send className="w-4 h-4" /> Envoyer le coupon
          </Bouton>
          {bloque && <p className="text-xs text-gray-500">Numéro injoignable : aucun message ne partirait.</p>}
        </>
      )}

      {message && (
        <div className="rounded-xl bg-white border border-gray-200 p-3 text-xs text-gray-600">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-700">{message.parti ? "Message envoyé" : "Message à lire au client"}</span>
            <button type="button" onClick={() => copier(message.texte)} className="text-[#F17922] font-semibold">
              Copier
            </button>
          </div>
          <p className="whitespace-pre-line">{message.texte}</p>
        </div>
      )}
    </div>
  );
}
