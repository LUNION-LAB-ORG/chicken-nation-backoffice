import React, { useState } from "react";
import { BarChart3, LayoutGrid, Megaphone, Plus } from "lucide-react";
import { useAuthStore } from "../../../users/hook/authStore";
import { useCampagnesQuery } from "../../queries/campagne.query";
import { ICampagne } from "../../types/campagne.type";
import { Bouton } from "../commun/Champs";
import { Chargement, Erreur, Vide } from "../commun/Etats";
import { CarteCampagne } from "./CarteCampagne";
import { Comparatif } from "./Comparatif";
import { EquipeCampagne } from "./EquipeCampagne";
import { FormCampagne } from "./FormCampagne";
import { TableauCampagne } from "./TableauCampagne";

/** Campagnes de conversion (cahier §6) : liste, tableau de bord, comparatif. */
export function Campagnes({
  estGestionnaire,
  peutExporter,
  peutAnalyser,
}: {
  estGestionnaire: boolean;
  peutExporter: boolean;
  peutAnalyser: boolean;
}) {
  const moi = useAuthStore((s) => s.user?.id);
  const { data: campagnes = [], isLoading, isError, error } = useCampagnesQuery();
  const [vue, setVue] = useState<"liste" | "comparatif">("liste");
  const [ouverteId, setOuverteId] = useState<string | null>(null);
  const [edition, setEdition] = useState<{ campagne: ICampagne | null } | null>(null);
  const [equipe, setEquipe] = useState<ICampagne | null>(null);

  const ouverte = campagnes.find((c) => c.id === ouverteId) ?? null;

  const modales = (
    <>
      {edition && <FormCampagne key={edition.campagne?.id ?? "nouvelle"} ouvert campagne={edition.campagne} onFermer={() => setEdition(null)} />}
      {equipe && <EquipeCampagne key={equipe.id} c={equipe} ouvert onFermer={() => setEquipe(null)} estGestionnaire={estGestionnaire} />}
    </>
  );

  if (ouverte) {
    return (
      <>
        <TableauCampagne
          c={ouverte}
          onRetour={() => setOuverteId(null)}
          estGestionnaire={estGestionnaire}
          estPilote={ouverte.lead_agent.id === moi}
          peutExporter={peutExporter}
          onModifier={() => setEdition({ campagne: ouverte })}
          onEquipe={() => setEquipe(ouverte)}
        />
        {modales}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {peutAnalyser ? (
          <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-xl p-1">
            {(
              [
                ["liste", "Campagnes", LayoutGrid],
                ["comparatif", "Comparatif", BarChart3],
              ] as const
            ).map(([cle, label, Icone]) => (
              <button
                key={cle}
                type="button"
                onClick={() => setVue(cle)}
                className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-lg ${
                  vue === cle ? "bg-white text-[#F17922] shadow-sm" : "text-[#71717A]"
                }`}
              >
                <Icone className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {estGestionnaire && (
          <Bouton variante="primaire" onClick={() => setEdition({ campagne: null })}>
            <Plus className="w-4 h-4" /> Nouvelle campagne
          </Bouton>
        )}
      </div>

      {vue === "comparatif" ? (
        <Comparatif />
      ) : isLoading ? (
        <Chargement />
      ) : isError ? (
        <Erreur message={(error as Error)?.message} />
      ) : campagnes.length === 0 ? (
        <Vide
          Icone={Megaphone}
          titre="Aucune campagne"
          texte="Une campagne donne un nom, une durée, une équipe et des objectifs à une opération de relance."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {campagnes.map((c) => (
            <CarteCampagne key={c.id} c={c} onOuvrir={() => setOuverteId(c.id)} />
          ))}
        </div>
      )}
      {modales}
    </div>
  );
}
