import React, { useState } from "react";
import { BarChart3, LayoutGrid, Megaphone, Plus } from "lucide-react";
import { useAuthStore } from "../../../users/hook/authStore";
import { useCampagneQuery, useCampagnesQuery } from "../../queries/campagne.query";
import { CampagneStatut, ICampagne, ICampagnesFiltres } from "../../types/campagne.type";
import { Public } from "../../types/contact.type";
import { CAMPAGNE_META, PUBLICS, PUBLIC_META } from "../../utils/crm-ui";
import { Bouton, ChampSelect } from "../commun/Champs";
import { Chargement, Erreur, Vide } from "../commun/Etats";
import { CarteCampagne } from "./CarteCampagne";
import { Comparatif } from "./Comparatif";
import { EquipeCampagne } from "./EquipeCampagne";
import { FormCampagne } from "./FormCampagne";
import { TableauCampagne } from "./TableauCampagne";

const STATUTS: CampagneStatut[] = ["PLANIFIED", "ACTIVE", "SUSPENDED", "COMPLETED"];

/** Campagnes de conversion (cahier §6) : liste filtrable, tableau de bord, comparatif. */
export function Campagnes({
  estGestionnaire,
  peutTraiter,
  peutExporter,
  peutAnalyser,
}: {
  estGestionnaire: boolean;
  /** Droit UPDATE : sans lui, piloter une campagne est refusé par le serveur, même à son pilote. */
  peutTraiter: boolean;
  peutExporter: boolean;
  peutAnalyser: boolean;
}) {
  const moi = useAuthStore((s) => s.user?.id);
  const [filtres, setFiltres] = useState<ICampagnesFiltres>({});
  const { data: campagnes = [], isPending, isError, error } = useCampagnesQuery(filtres);
  const [vue, setVue] = useState<"liste" | "comparatif">("liste");
  const [ouverteId, setOuverteId] = useState<string | null>(null);
  const [edition, setEdition] = useState<{ campagne: ICampagne | null } | null>(null);
  const [equipe, setEquipe] = useState<ICampagne | null>(null);
  // Le détail garde l'écran ouvert quand un geste (lancer, terminer) sort la campagne du filtre de la liste.
  const detail = useCampagneQuery(ouverteId);

  const ouverte = ouverteId ? (detail.data ?? campagnes.find((c) => c.id === ouverteId) ?? null) : null;
  const filtre = !!(filtres.status || filtres.segment);

  const modales = (
    <>
      {edition && <FormCampagne key={edition.campagne?.id ?? "nouvelle"} ouvert campagne={edition.campagne} onFermer={() => setEdition(null)} />}
      {equipe && <EquipeCampagne key={equipe.id} c={equipe} ouvert onFermer={() => setEquipe(null)} estGestionnaire={estGestionnaire} />}
    </>
  );

  if (ouverteId) {
    if (!ouverte) {
      return detail.isError ? (
        <div className="space-y-3">
          <Bouton variante="discret" onClick={() => setOuverteId(null)}>
            Toutes les campagnes
          </Bouton>
          <Erreur message={(detail.error as Error)?.message} />
        </div>
      ) : (
        <Chargement />
      );
    }
    return (
      <>
        <TableauCampagne
          c={ouverte}
          onRetour={() => setOuverteId(null)}
          estGestionnaire={estGestionnaire}
          estPilote={peutTraiter && ouverte.lead_agent.id === moi}
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

      {vue === "liste" && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-48">
            <ChampSelect
              valeur={filtres.status ?? ""}
              onChange={(v) => setFiltres((x) => ({ ...x, status: (v || undefined) as CampagneStatut | undefined }))}
              vide="Tous les statuts"
              options={STATUTS.map((s) => ({ value: s, label: CAMPAGNE_META[s].label }))}
            />
          </div>
          <div className="w-full sm:w-56">
            <ChampSelect
              valeur={filtres.segment ?? ""}
              onChange={(v) => setFiltres((x) => ({ ...x, segment: (v || undefined) as Public | undefined }))}
              vide="Tous les publics"
              options={PUBLICS.map((p) => ({ value: p, label: PUBLIC_META[p].label }))}
            />
          </div>
          {filtre && (
            <Bouton variante="discret" onClick={() => setFiltres({})}>
              Effacer les filtres
            </Bouton>
          )}
        </div>
      )}

      {vue === "comparatif" ? (
        <Comparatif peutExporter={peutExporter} />
      ) : isError ? (
        <Erreur message={(error as Error)?.message} />
      ) : isPending ? (
        <Chargement />
      ) : campagnes.length === 0 ? (
        filtre ? (
          <Vide titre="Aucune campagne pour ces filtres" texte="Changez de statut ou de public, ou effacez les filtres." />
        ) : (
          <Vide
            Icone={Megaphone}
            titre="Aucune campagne"
            texte="Une campagne donne un nom, une durée, une équipe, des publics et des objectifs à une opération de relance."
          />
        )
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
