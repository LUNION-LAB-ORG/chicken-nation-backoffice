import React, { useState } from "react";
import { Download, History, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { prospectAPI } from "../../apis/prospect.api";
import { IProspectFiltres } from "../../types/prospect.type";
import { Bouton } from "../commun/Champs";
import { HistoriqueExports } from "./HistoriqueExports";

/** L'export sort exactement ce que la liste affiche, filtres compris (cahier §4.2). */
export function ExportProspects({ filtres }: { filtres: IProspectFiltres }) {
  const [enCours, setEnCours] = useState<"csv" | "xlsx" | null>(null);
  const [historique, setHistorique] = useState(false);

  const exporter = async (format: "csv" | "xlsx") => {
    setEnCours(format);
    try {
      await prospectAPI.exporter(filtres, format);
      toast.success("Export téléchargé, et inscrit à l'historique");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {(["xlsx", "csv"] as const).map((f) => (
        <Bouton key={f} desactive={!!enCours} onClick={() => exporter(f)}>
          {enCours === f ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {f === "xlsx" ? "Excel" : "CSV"}
        </Bouton>
      ))}
      <Bouton variante="discret" onClick={() => setHistorique(true)}>
        <History className="w-4 h-4" /> Historique
      </Bouton>
      <HistoriqueExports ouvert={historique} onFermer={() => setHistorique(false)} />
    </div>
  );
}
