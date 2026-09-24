import React, { useState } from "react";
import { ChevronRight, Loader2, PhoneIncoming } from "lucide-react";
import { useAuthStore } from "../../../users/hook/authStore";
import { useRechercheNumeroQuery } from "../../queries/contact.query";
import { fmtTelephone, origine } from "../../utils/crm-ui";
import { classeChamp } from "../commun/Champs";
import { PucePublic, PuceStatut } from "../commun/Puces";

/**
 * Un client appelle (« je n'ai pas reçu mon code ») : l'agent retrouve sa
 * fiche par son numéro, même si elle est suivie par un collègue. Il peut la
 * lire et renvoyer le coupon déjà envoyé ; le client reste à son agent.
 */
export function RechercheNumero({ onOuvrir }: { onOuvrir: (id: string, telephone?: string) => void }) {
  const moi = useAuthStore((s) => s.user?.id);
  const [numero, setNumero] = useState("");
  // Numéro ivoirien : la recherche part au 10e chiffre. Numéro étranger plus
  // court : l'agent valide avec Entrée. Jamais de recherche sur un début de numéro.
  const [valide, setValide] = useState(false);
  const chiffres = numero.replace(/\D/g, "");
  const complet = valide || chiffres.length >= 10;
  const { data: lignes, isFetching, isError, error } = useRechercheNumeroQuery(numero, complet);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800" htmlFor="crm-numero-entrant">
        <PhoneIncoming className="w-4 h-4 text-[#F17922]" /> Un client appelle ?
      </label>
      <div className="relative">
        <input
          id="crm-numero-entrant"
          value={numero}
          onChange={(e) => {
            setNumero(e.target.value);
            setValide(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && chiffres.length >= 8) setValide(true);
          }}
          inputMode="tel"
          placeholder="Tapez son numéro complet (Entrée pour un numéro étranger)"
          className={classeChamp}
        />
        {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {complet && isError && <p className="text-sm text-rose-700">{(error as Error)?.message}</p>}
      {complet && !isError && lignes && lignes.length === 0 && (
        <p className="text-sm text-gray-500">Aucune fiche pour ce numéro dans le CRM.</p>
      )}
      {complet && lignes && lignes.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {lignes.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => onOuvrir(l.id, chiffres)}
                className="w-full flex items-center gap-3 py-2 text-left hover:bg-gray-50 rounded-lg px-1"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{l.nom}</p>
                    <PucePublic segment={l.segment} />
                    <PuceStatut statut={l.status} segment={l.segment} />
                  </div>
                  <p className="text-xs text-gray-500">
                    {fmtTelephone(l.telephone)} · {origine(l)} ·{" "}
                    {l.assigned_to
                      ? l.assigned_to.id === moi
                        ? "votre client"
                        : `suivi par ${l.assigned_to.fullname}`
                      : "sans agent"}
                    {l.coupon?.etat === "ACTIF" && ` · coupon ${l.coupon.code} actif`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
