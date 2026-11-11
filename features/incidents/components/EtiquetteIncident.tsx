"use client";

import React, { useContext } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useDroitsIncidents } from "../hooks/useDroitsIncidents";
import { useIncidentsOuvertsQuery } from "../queries/incident.query";
import { useIncidentsUi } from "../stores/incident-ui.store";

function Etiquette({ orderId }: { orderId: string }) {
  const { voir } = useDroitsIncidents();
  const { data } = useIncidentsOuvertsQuery(voir);
  const ouvrirFiche = useIncidentsUi((s) => s.ouvrirFiche);
  const incident = voir ? data?.get(orderId) : undefined;
  if (!incident) return null;

  const ouvrir = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    ouvrirFiche(incident.id);
  };
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={ouvrir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") ouvrir(e);
      }}
      title={`Incident ${incident.code} : ouvrir la fiche`}
      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-orange-300 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-[#9A3412] hover:bg-orange-100"
    >
      <AlertTriangle className="h-3 w-3" />
      {incident.categorie}
    </span>
  );
}

/**
 * Étiquette d'une commande dans une liste : la catégorie de son incident non
 * clôturé (« Livraison tardive »). Rien quand la commande n'en a pas. Un clic
 * ouvre la fiche de l'incident, sans ouvrir la commande.
 *
 * Toutes les cartes lisent la même requête : une seule lecture pour la liste.
 * Hors de l'application (une carte rendue seule, dans un test), il n'y a pas
 * de requêtes : l'étiquette ne s'affiche pas, la carte reste rendable.
 */
export function EtiquetteIncident({ orderId }: { orderId: string }) {
  const requetes = useContext(QueryClientContext);
  if (!requetes) return null;
  return <Etiquette orderId={orderId} />;
}
