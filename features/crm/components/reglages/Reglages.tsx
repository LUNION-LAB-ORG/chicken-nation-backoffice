import React from "react";
import { useReglagesQuery } from "../../queries/reglage.query";
import { EtatRequete } from "../commun/Etats";
import { EditeurOffres } from "./EditeurOffres";
import { EditeurRaisons } from "./EditeurRaisons";
import { EditeurStatuts } from "./EditeurStatuts";
import { ReglagesGeneraux } from "./ReglagesGeneraux";

/**
 * Configuration des listes déroulantes et du module (cahier §9 : réservée à
 * la direction). `lectureSeule` : le lecteur (marketing, manager) voit les
 * réglages sans rien pouvoir ajouter, modifier, déplacer ni retirer.
 */
export function Reglages({ lectureSeule = false }: { lectureSeule?: boolean }) {
  const requete = useReglagesQuery();
  return (
    <div className="space-y-4">
      <EtatRequete requete={requete}>
        {requete.data && <ReglagesGeneraux initial={requete.data} lectureSeule={lectureSeule} />}
      </EtatRequete>
      <div className="grid gap-4 xl:grid-cols-2">
        <EditeurStatuts lectureSeule={lectureSeule} />
        <EditeurRaisons lectureSeule={lectureSeule} />
      </div>
      <EditeurOffres lectureSeule={lectureSeule} />
    </div>
  );
}
