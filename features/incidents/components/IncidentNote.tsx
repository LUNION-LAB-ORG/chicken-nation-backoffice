"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useDroitsIncidents } from "../hooks/useDroitsIncidents";
import { useIncidentsUi } from "../stores/incident-ui.store";
import type { IncidentStatut } from "../types/incident.types";
import { COULEUR_STATUT, LIBELLE_STATUT, graviteDepuisNote } from "../utils/incident";

/** Au-delà de trois étoiles, une note n'appelle pas d'incident. */
const NOTE_MAX_A_SIGNALER = 3;

/**
 * Sous une note après commande (Notes et avis) : l'incident qu'elle a ouvert,
 * ou « Créer un incident » pour une note de trois étoiles ou moins. La
 * fenêtre reprend le commentaire du client comme description.
 */
export function IncidentNote({
  commentId,
  orderId,
  note,
  message,
  incident,
}: {
  commentId: string;
  orderId: string | null | undefined;
  note: number;
  message: string | null | undefined;
  incident: { id: string; code: string; statut: string } | null | undefined;
}) {
  const { voir, signaler: peutSignaler } = useDroitsIncidents();
  const ouvrirFiche = useIncidentsUi((s) => s.ouvrirFiche);
  const signaler = useIncidentsUi((s) => s.signaler);
  if (!voir) return null;

  if (incident) {
    const statut = incident.statut as IncidentStatut;
    const couleur = COULEUR_STATUT[statut] ?? COULEUR_STATUT.OUVERT;
    return (
      <button
        type="button"
        onClick={() => ouvrirFiche(incident.id)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
        style={{ backgroundColor: couleur.fond, color: couleur.texte }}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Incident {incident.code}
        <span className="font-normal opacity-80">· {(LIBELLE_STATUT[statut] ?? incident.statut).toLowerCase()}</span>
      </button>
    );
  }

  if (!peutSignaler || !orderId || note > NOTE_MAX_A_SIGNALER) return null;
  return (
    <button
      type="button"
      onClick={() =>
        signaler({
          orderId,
          commentId,
          gravite: graviteDepuisNote(note),
          description: message?.trim() || undefined,
        })
      }
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#C2410C]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#9A3412] transition hover:bg-orange-50"
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      Créer un incident
    </button>
  );
}
