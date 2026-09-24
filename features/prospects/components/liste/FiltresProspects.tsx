import React, { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { IProspectFiltres } from "../../types/prospect.type";
import { useAgentsQuery } from "../../queries/prospect.query";
import { useCampagnesQuery } from "../../queries/campagne.query";
import { STATUTS_ORDRE, STATUT_META } from "../../utils/prospect-ui";
import { ChampSelect, classeChamp } from "../commun/Champs";
import { FiltresAvances } from "./FiltresAvances";

const A_TRAVAILLER = "A_APPELER,A_RAPPELER,INTERESSE,COUPON_ENVOYE";

/**
 * Filtres combinables de la liste (cahier §4.2). La recherche attend que
 * l'agent ait fini de taper : une requête par frappe ralentirait tout le monde.
 */
export function FiltresProspects({
  filtres,
  onChange,
  avecAgent,
}: {
  filtres: IProspectFiltres;
  onChange: (f: IProspectFiltres) => void;
  avecAgent: boolean;
}) {
  const [texte, setTexte] = useState(filtres.search ?? "");
  const [avances, setAvances] = useState(false);
  const { data: agents = [] } = useAgentsQuery();
  const { data: campagnes = [] } = useCampagnesQuery();

  useEffect(() => {
    const minuterie = setTimeout(() => {
      if ((filtres.search ?? "") !== texte) onChange({ ...filtres, search: texte || undefined, page: 1 });
    }, 400);
    return () => clearTimeout(minuterie);
  }, [texte, filtres, onChange]);

  const maj = (partiel: Partial<IProspectFiltres>) => onChange({ ...filtres, ...partiel, page: 1 });
  const nbAvances = [
    filtres.coupon, filtres.loss_reason_id, filtres.call_status_id, filtres.registered_from, filtres.registered_to,
    filtres.last_call_from, filtres.last_call_to, filtres.never_called, filtres.abandoned,
  ].filter(Boolean).length;
  const actifs = Object.entries(filtres).some(([k, v]) => !["page", "limit", "sort"].includes(k) && v);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Nom, téléphone ou e-mail"
            className={`${classeChamp} pl-9`}
          />
        </label>
        <ChampSelect
          valeur={filtres.status ?? ""}
          onChange={(v) => maj({ status: v || undefined })}
          vide="Tous, hors convertis"
          options={[
            { value: A_TRAVAILLER, label: "À travailler" },
            ...STATUTS_ORDRE.map((s) => ({ value: s, label: STATUT_META[s].label })),
          ]}
        />
        {avecAgent && (
          <ChampSelect
            valeur={filtres.agent_id ?? ""}
            onChange={(v) => maj({ agent_id: v || undefined })}
            vide="Tous les agents"
            options={[{ value: "none", label: "Sans agent" }, ...agents.map((a) => ({ value: a.id, label: a.fullname }))]}
          />
        )}
        <ChampSelect
          valeur={filtres.campaign_id ?? ""}
          onChange={(v) => maj({ campaign_id: v || undefined })}
          vide="Toutes les campagnes"
          options={[{ value: "none", label: "Hors campagne" }, ...campagnes.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <button
          type="button"
          onClick={() => setAvances((v) => !v)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
            avances || nbAvances ? "border-[#F17922] text-[#F17922] bg-orange-50" : "border-gray-200 text-gray-700"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Plus de filtres{nbAvances ? ` (${nbAvances})` : ""}
        </button>
      </div>
      {avances && <FiltresAvances filtres={filtres} onChange={maj} />}
      {actifs && (
        <button
          type="button"
          onClick={() => {
            setTexte("");
            onChange({ page: 1, limit: filtres.limit, sort: filtres.sort });
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#F17922]"
        >
          <X className="w-3.5 h-3.5" /> Effacer les filtres
        </button>
      )}
    </div>
  );
}
