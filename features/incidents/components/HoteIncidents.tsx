"use client";

import React from "react";
import { useDroitsIncidents } from "../hooks/useDroitsIncidents";
import { useIncidentsSocketSync } from "../hooks/useIncidentsSocketSync";
import { useIncidentsUi } from "../stores/incident-ui.store";
import { FicheIncident } from "./FicheIncident";
import { SignalerIncident } from "./SignalerIncident";

/**
 * Monté UNE fois dans la page de gestion : la fiche d'un incident et la
 * fenêtre « Signaler un incident » s'ouvrent par-dessus n'importe quel écran
 * (tiroir d'une commande, ticket, avis, CRM, cloche). Le temps réel des
 * incidents s'abonne ici, pour tous les écrans à la fois.
 */
export function HoteIncidents() {
  const { voir, signaler: peutSignaler } = useDroitsIncidents();
  const ficheId = useIncidentsUi((s) => s.ficheId);
  const fermerFiche = useIncidentsUi((s) => s.fermerFiche);
  const signalement = useIncidentsUi((s) => s.signalement);
  const fermerSignalement = useIncidentsUi((s) => s.fermerSignalement);
  useIncidentsSocketSync(voir);

  if (!voir) return null;
  return (
    <>
      <FicheIncident id={ficheId} onFermer={fermerFiche} />
      {signalement && peutSignaler && (
        // Une fenêtre neuve par demande : rien ne reste de la précédente.
        <SignalerIncident key={JSON.stringify(signalement)} demande={signalement} onFermer={fermerSignalement} />
      )}
    </>
  );
}

export default HoteIncidents;
