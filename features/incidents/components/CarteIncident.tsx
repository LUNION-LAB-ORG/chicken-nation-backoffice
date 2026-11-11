import React from "react";
import { AlertTriangle } from "lucide-react";
import type { IncidentLigne } from "../types/incident.types";
import { LIBELLE_GESTE, LIBELLE_POLE, finDeReference, formatMontant, texteTempsCarte } from "../utils/incident";

const BORD: Record<IncidentLigne["gravite"], string> = {
  HAUTE: "border-l-red-500",
  MOYENNE: "border-l-amber-400",
  FAIBLE: "border-l-transparent",
};

/**
 * Une carte du tableau des incidents : la catégorie, le restaurant (sur
 * « Tous »), le client et la fin de la référence, puis le temps en toutes
 * lettres (« en retard de 3 h », « à résoudre avant le… ») et qui en répond.
 * Le bord gauche dit la gravité. Un clic ouvre la fiche.
 */
export function CarteIncident({
  incident,
  maintenant,
  avecRestaurant,
  onOuvrir,
}: {
  incident: IncidentLigne;
  maintenant: Date;
  avecRestaurant: boolean;
  onOuvrir: (id: string) => void;
}) {
  const temps = texteTempsCarte(incident, maintenant);
  const geste =
    incident.geste === "BON" && incident.bon_montant
      ? `Bon de ${formatMontant(incident.bon_montant)}`
      : incident.geste
        ? LIBELLE_GESTE[incident.geste]
        : null;
  const resolu = incident.statut === "RESOLU" || incident.statut === "CLOTURE";

  return (
    <button
      type="button"
      onClick={() => onOuvrir(incident.id)}
      aria-label={`Incident ${incident.code}`}
      className={`flex w-full flex-col gap-1 rounded-xl border border-l-4 border-[#E4E4E7] bg-white p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-[#F17922]/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922]/50 ${BORD[incident.gravite]}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-[13px] font-semibold text-[#18181B]">{incident.categorie.nom}</span>
        {incident.gravite === "HAUTE" && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Gravité haute</span>
        )}
      </span>
      <span className="truncate text-[11px] text-[#52525B]">
        {avecRestaurant ? `${incident.restaurant.name} · ` : ""}
        {incident.client.nom} · {finDeReference(incident.commande.reference)}
      </span>
      <span
        className={`flex items-center gap-1 text-[11px] ${temps.retard ? "font-semibold text-red-700" : "text-[#71717A]"}`}
      >
        {temps.retard && <AlertTriangle className="h-3 w-3 shrink-0" />}
        {temps.texte}
      </span>
      <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-[#52525B]">
          {incident.agent ? incident.agent.fullname : LIBELLE_POLE[incident.pole]}
        </span>
        {resolu && geste && (
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-[#B45309]">{geste}</span>
        )}
      </span>
    </button>
  );
}
