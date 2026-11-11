"use client";

import React from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { useDroitsIncidents } from "../hooks/useDroitsIncidents";
import { useIncidentsCommandeQuery } from "../queries/incident.query";
import { useIncidentsUi } from "../stores/incident-ui.store";
import type { DemandeSignalement, IncidentLigne } from "../types/incident.types";
import { COULEUR_STATUT, LIBELLE_STATUT } from "../utils/incident";

/** Un incident de la commande : sa catégorie et son statut ; un clic ouvre sa fiche. */
function Puce({ incident, onOuvrir }: { incident: IncidentLigne; onOuvrir: (id: string) => void }) {
  const couleur = COULEUR_STATUT[incident.statut];
  return (
    <button
      type="button"
      onClick={() => onOuvrir(incident.id)}
      title={`Ouvrir l'incident ${incident.code}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold transition hover:border-current"
      style={{ backgroundColor: couleur.fond, color: couleur.texte }}
    >
      {incident.categorie.nom}
      <span className="font-normal opacity-80">· {LIBELLE_STATUT[incident.statut].toLowerCase()}</span>
    </button>
  );
}

/**
 * INCIDENTS D'UNE COMMANDE, là où la commande est déjà à l'écran (tiroir des
 * commandes, ticket) : ceux qui existent, en étiquettes qui ouvrent la fiche,
 * et « Signaler un incident » pour qui en a le droit sur cette commande.
 *
 * Rien à montrer et rien à signaler : le bloc ne s'affiche pas.
 *
 * `cadre` : « carte » dans le tiroir d'une commande (même allure que ses
 * autres sections), « ligne » dans un en-tête.
 */
export function IncidentsCommande({
  orderId,
  demande,
  cadre = "ligne",
}: {
  orderId: string | null | undefined;
  /** Ce que l'écran sait déjà du signalement (ticket d'origine, description). */
  demande?: Omit<DemandeSignalement, "orderId">;
  cadre?: "carte" | "ligne";
}) {
  const { voir } = useDroitsIncidents();
  const { data } = useIncidentsCommandeQuery(orderId, voir);
  const ouvrirFiche = useIncidentsUi((s) => s.ouvrirFiche);
  const signaler = useIncidentsUi((s) => s.signaler);

  if (!voir || !orderId || !data) return null;
  const { incidents, peut_signaler } = data;
  if (incidents.length === 0 && !peut_signaler) return null;

  const bouton = peut_signaler && (
    <button
      type="button"
      onClick={() => signaler({ ...demande, orderId })}
      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-[#F17922] hover:text-[#F17922]"
    >
      <Plus className="h-3.5 w-3.5" />
      Signaler un incident
    </button>
  );
  const puces = incidents.map((i) => <Puce key={i.id} incident={i} onOuvrir={ouvrirFiche} />);

  if (cadre === "ligne") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {puces}
        {bouton}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF0E4] text-[#F17922]">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <h3 className="text-[15px] font-bold text-gray-900">Incidents</h3>
        {incidents.length === 0 && <span className="ml-auto text-xs text-gray-400">Aucun incident signalé</span>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {puces}
        {bouton}
      </div>
    </div>
  );
}
