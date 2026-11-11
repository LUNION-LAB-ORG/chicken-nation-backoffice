import React from "react";
import { Copy, Loader2, Send, TicketPercent } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCreerBonIncidentMutation, useRenvoyerSmsIncidentMutation } from "../../queries/incident.mutation";
import type { IncidentFiche } from "../../types/incident.types";
import { formatJour, formatJourHeure, formatMontant } from "../../utils/incident";

const ETAT_BON: Record<string, string> = {
  REDEEMED: "Utilisé",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

/**
 * Le bon de réduction de l'incident : montant, code (lisible seulement par
 * qui traite l'incident), validité, et ce qu'il est advenu du SMS. Quand la
 * création a échoué à la résolution, « Créer le bon ».
 */
export function BonIncident({ incident }: { incident: IncidentFiche }) {
  const renvoyer = useRenvoyerSmsIncidentMutation();
  const creer = useCreerBonIncidentMutation();
  const { bon, droits } = incident;

  if (!bon) {
    if (!incident.bon_a_creer) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-[13px] text-amber-900">
          Le bon de {formatMontant(incident.bon_montant)} n&apos;a pas pu être créé.
        </p>
        {droits.traiter && (
          <button
            type="button"
            disabled={creer.isPending}
            onClick={() => creer.mutate({ id: incident.id, valeur: undefined })}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 text-[13px] font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            {creer.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Créer le bon
          </button>
        )}
      </div>
    );
  }

  const utilisable = bon.statut === "ACTIVE";
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(bon.code);
      toast.success("Code copié");
    } catch {
      toast.error("Copie impossible");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TicketPercent className="h-4 w-4 shrink-0 text-[#F17922]" />
        <span className="text-sm font-bold text-gray-900">Bon de {formatMontant(bon.montant)}</span>
        <span className="font-mono text-sm font-semibold tracking-wider text-[#B45309]">{bon.code}</span>
        {droits.traiter && utilisable && (
          <button type="button" onClick={copier} title="Copier le code" className="rounded p-1 text-gray-500 hover:bg-white hover:text-[#F17922]">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
        {!utilisable && <span className="text-xs font-semibold text-gray-500">{ETAT_BON[bon.statut] ?? bon.statut}</span>}
      </div>
      <p className="text-xs text-gray-600">
        {bon.expire_at ? `Valable jusqu'au ${formatJour(bon.expire_at)}. ` : ""}
        {bon.message_canal === "SMS"
          ? `Code envoyé par SMS le ${formatJourHeure(bon.message_at)}.`
          : "Le SMS n'est pas parti : dictez le code au client."}
      </p>
      {droits.traiter && utilisable && (
        <button
          type="button"
          disabled={renvoyer.isPending}
          onClick={() => renvoyer.mutate({ id: incident.id, valeur: undefined })}
          className="inline-flex h-8 items-center gap-1.5 self-start rounded-lg border border-orange-200 bg-white px-3 text-xs font-semibold text-[#B45309] hover:bg-orange-50 disabled:opacity-50"
        >
          {renvoyer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Renvoyer le SMS
        </button>
      )}
    </div>
  );
}
