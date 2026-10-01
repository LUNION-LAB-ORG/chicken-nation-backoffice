"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSocket } from "../../websocket/hooks/useSocket";
import { EVENEMENT_RELANCE } from "../constantes/relance.constante";
import { RELANCES_CLE, relancesKey } from "../queries/relance.query";
import { RelanceChangeeEvenement, RelancesReponse } from "../types/relance.types";
import { cleAlerte } from "../utils/relance";

/**
 * Temps réel de la relance : `relance:changed` relit la liste (jamais de
 * compteur tiré de l'événement, qui ne porte que des identifiants).
 *
 * Sur une alerte, `surAlerte` reçoit les clés d'alerte (cleAlerte) des têtes
 * annoncées qui sont ENCORE à relancer dans la réponse relue : un groupe déjà
 * pris par un collègue, ignoré ou payé entre-temps ne sonne pas.
 */
export const useRelancesSocketSync = (actif: boolean, surAlerte: (cles: string[], relue?: RelancesReponse) => void) => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const rappel = useRef(surAlerte);
  useEffect(() => {
    rappel.current = surAlerte;
  }, [surAlerte]);

  useEffect(() => {
    if (!socket || !actif) return;

    const surChangement = async (charge?: RelanceChangeeEvenement) => {
      await queryClient.invalidateQueries({ queryKey: relancesKey(), exact: false });
      const nouvelles = Array.isArray(charge?.nouvelles) ? charge.nouvelles : [];
      if (charge?.motif !== "alerte" || nouvelles.length === 0) return;

      // Clés tirées de la réponse relue : tête ET instant de l'alerte, si
      // bien qu'une réalerte (prise expirée) ne se confond pas avec la première.
      const data = queryClient.getQueryData<RelancesReponse>(RELANCES_CLE);
      const annoncees = new Set(nouvelles);
      const cles = (data?.groupes ?? [])
        .filter((g) => g.etat === "A_RELANCER" && (annoncees.has(g.cle) || annoncees.has(g.tete.id)))
        .map(cleAlerte);
      if (cles.length > 0) rappel.current(cles, data);
    };

    socket.on(EVENEMENT_RELANCE, surChangement);
    return () => {
      socket.off(EVENEMENT_RELANCE, surChangement);
    };
  }, [socket, actif, queryClient]);
};
