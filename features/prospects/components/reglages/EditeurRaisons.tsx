import React, { useState } from "react";
import { MessageSquareWarning, Plus } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useListeMutation, useRaisonsQuery } from "../../queries/reglage.query";
import { Bouton, classeChamp } from "../commun/Champs";
import { LigneOrdonnee, deplacer } from "./LigneOrdonnee";

/** Raisons de non-commande (cahier §4.1 et §11), obligatoires quand un client refuse. */
export function EditeurRaisons() {
  const { data: raisons = [] } = useRaisonsQuery();
  const liste = useListeMutation("raisons");
  const [nom, setNom] = useState("");

  return (
    <StatsChartCard title="Raisons de non-commande" subtitle="Elles alimentent le Pareto des blocages" icon={MessageSquareWarning}>
      <ul className="space-y-2">
        {raisons.map((r, i) => (
          <LigneOrdonnee
            key={r.id}
            actif={r.is_active}
            onActif={(v) => liste.mutate({ type: "modifier", id: r.id, dto: { is_active: v } })}
            onMonter={() => liste.mutate({ type: "reordonner", ids: deplacer(raisons, i, -1) })}
            onDescendre={() => liste.mutate({ type: "reordonner", ids: deplacer(raisons, i, 1) })}
            onRetirer={() => liste.mutate({ type: "supprimer", id: r.id })}
            premier={i === 0}
            dernier={i === raisons.length - 1}
          >
            <input
              defaultValue={r.name}
              onBlur={(e) => e.target.value.trim() !== r.name && liste.mutate({ type: "modifier", id: r.id, dto: { name: e.target.value.trim() } })}
              className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none border-b border-transparent focus:border-[#F17922]"
            />
          </LigneOrdonnee>
        ))}
      </ul>
      <div className="flex gap-2 mt-3">
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nouvelle raison" className={`${classeChamp} flex-1`} />
        <Bouton
          variante="primaire"
          desactive={nom.trim().length < 2 || liste.isPending}
          onClick={() => liste.mutate({ type: "ajouter", dto: { name: nom.trim() } }, { onSuccess: () => setNom("") })}
        >
          <Plus className="w-4 h-4" /> Ajouter
        </Bouton>
      </div>
    </StatsChartCard>
  );
}
