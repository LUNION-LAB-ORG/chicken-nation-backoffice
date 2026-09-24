import React, { useState } from "react";
import { PhoneCall, Plus } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useListeMutation, useStatutsAppelQuery } from "../../queries/reglage.query";
import { AppelEffet } from "../../types/prospect.type";
import { EFFET_META } from "../../utils/prospect-ui";
import { Bouton, classeChamp } from "../commun/Champs";
import { LigneOrdonnee, deplacer } from "./LigneOrdonnee";

const EFFETS = Object.entries(EFFET_META) as [AppelEffet, (typeof EFFET_META)[AppelEffet]][];

/**
 * Statuts d'appel (cahier §11 : repris du fichier Excel). Le libellé est
 * libre ; l'effet, lui, décide de ce que devient le prospect et de ce que
 * comptent les statistiques.
 */
export function EditeurStatuts() {
  const { data: statuts = [] } = useStatutsAppelQuery();
  const liste = useListeMutation("statuts");
  const [libelle, setLibelle] = useState("");
  const [effet, setEffet] = useState<AppelEffet>("NON_JOINT");

  return (
    <StatsChartCard title="Statuts d'appel" subtitle="Ce que l'agent choisit après chaque appel" icon={PhoneCall}>
      <ul className="space-y-2">
        {statuts.map((s, i) => (
          <LigneOrdonnee
            key={s.id}
            actif={s.is_active}
            onActif={(v) => liste.mutate({ type: "modifier", id: s.id, dto: { is_active: v } })}
            onMonter={() => liste.mutate({ type: "reordonner", ids: deplacer(statuts, i, -1) })}
            onDescendre={() => liste.mutate({ type: "reordonner", ids: deplacer(statuts, i, 1) })}
            onRetirer={() => liste.mutate({ type: "supprimer", id: s.id })}
            premier={i === 0}
            dernier={i === statuts.length - 1}
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                defaultValue={s.label}
                onBlur={(e) => e.target.value.trim() !== s.label && liste.mutate({ type: "modifier", id: s.id, dto: { label: e.target.value.trim() } })}
                className="flex-1 min-w-[140px] bg-transparent text-sm font-semibold text-gray-800 outline-none border-b border-transparent focus:border-[#F17922]"
              />
              <select
                value={s.outcome}
                onChange={(e) => liste.mutate({ type: "modifier", id: s.id, dto: { outcome: e.target.value as AppelEffet } })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
              >
                {EFFETS.map(([cle, m]) => (
                  <option key={cle} value={cle}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </LigneOrdonnee>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 mt-3">
        <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Nouveau statut" className={`${classeChamp} flex-1 min-w-[160px]`} />
        <select value={effet} onChange={(e) => setEffet(e.target.value as AppelEffet)} className={`${classeChamp} w-auto`}>
          {EFFETS.map(([cle, m]) => (
            <option key={cle} value={cle}>
              {m.label}
            </option>
          ))}
        </select>
        <Bouton
          variante="primaire"
          desactive={libelle.trim().length < 2 || liste.isPending}
          onClick={() => liste.mutate({ type: "ajouter", dto: { label: libelle.trim(), outcome: effet } }, { onSuccess: () => setLibelle("") })}
        >
          <Plus className="w-4 h-4" /> Ajouter
        </Bouton>
      </div>
    </StatsChartCard>
  );
}
