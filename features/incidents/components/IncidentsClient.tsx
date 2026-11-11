"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useDroitsIncidents } from "../hooks/useDroitsIncidents";
import { useListeIncidentsQuery } from "../queries/incident.query";
import { useIncidentsUi } from "../stores/incident-ui.store";
import { COULEUR_STATUT, LIBELLE_STATUT, formatJour } from "../utils/incident";

const AFFICHES = 5;

/**
 * Les incidents d'un client, dans sa fiche du CRM : avant de l'appeler,
 * l'agent sait ce qui s'est mal passé et où en est le traitement. Un clic
 * ouvre la fiche de l'incident. Aucun incident : rien ne s'affiche.
 */
export function IncidentsClient({ customerId }: { customerId: string | null | undefined }) {
  const { voir } = useDroitsIncidents();
  const ouvrirFiche = useIncidentsUi((s) => s.ouvrirFiche);
  const { data } = useListeIncidentsQuery({ customerId: customerId ?? undefined, limit: AFFICHES }, voir && !!customerId);
  if (!voir || !customerId || !data || data.data.length === 0) return null;

  const reste = data.meta.total - data.data.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412]">
        <AlertTriangle className="h-3.5 w-3.5" />
        {data.meta.total > 1 ? `${data.meta.total} incidents` : "1 incident"}
      </span>
      {data.data.map((i) => {
        const couleur = COULEUR_STATUT[i.statut];
        return (
          <button
            key={i.id}
            type="button"
            onClick={() => ouvrirFiche(i.id)}
            title={`${i.code} · signalé le ${formatJour(i.created_at)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold transition hover:border-current"
            style={{ backgroundColor: couleur.fond, color: couleur.texte }}
          >
            {i.categorie.nom}
            <span className="font-normal opacity-80">· {LIBELLE_STATUT[i.statut].toLowerCase()}</span>
          </button>
        );
      })}
      {reste > 0 && <span className="text-xs text-gray-500">et {reste} de plus</span>}
    </div>
  );
}
