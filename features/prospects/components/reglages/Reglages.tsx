import React from "react";
import { useReglagesQuery } from "../../queries/reglage.query";
import { Chargement } from "../commun/Etats";
import { EditeurOffres } from "./EditeurOffres";
import { EditeurRaisons } from "./EditeurRaisons";
import { EditeurStatuts } from "./EditeurStatuts";
import { ReglagesGeneraux } from "./ReglagesGeneraux";

/** Configuration des listes déroulantes et du module (cahier §9 : réservé à la direction). */
export function Reglages() {
  const { data: reglages, isLoading } = useReglagesQuery();
  return (
    <div className="space-y-4">
      {isLoading || !reglages ? <Chargement /> : <ReglagesGeneraux initial={reglages} />}
      <div className="grid gap-4 xl:grid-cols-2">
        <EditeurStatuts />
        <EditeurRaisons />
      </div>
      <EditeurOffres />
    </div>
  );
}
