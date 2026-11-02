import React, { useMemo } from "react";
import { Search, X } from "lucide-react";
import { useRestaurantListQuery } from "../../../restaurants/queries/restaurant-list.query";
import { STORE_INCONNU, type FiltresAvis, type PeriodeAvis } from "../../types/avis-prive.types";
import { JE_NE_SAIS_PAS, LIBELLE_RESSENTI, LIBELLE_STATUT, PERIODES, RESSENTIS, STATUTS } from "../../utils/avis-prive";
import { ChampListe, classeChamp } from "./Elements";

/** Store : restaurants actifs, puis « Je ne sais pas ». Absent pour un point de vente. */
function FiltreStore({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const { data } = useRestaurantListQuery();
  const options = useMemo(() => {
    const restaurants = ((data?.data ?? []) as { id: string; name: string; entity_status?: string }[]).filter(
      (r) => !r.entity_status || r.entity_status === "ACTIVE",
    );
    return [
      ...restaurants.map((r) => ({ valeur: r.id, libelle: r.name })),
      { valeur: STORE_INCONNU, libelle: JE_NE_SAIS_PAS },
    ];
  }, [data]);
  return <ChampListe label="Store" valeur={valeur} onChange={onChange} vide="Tous" options={options} className="min-w-[160px]" />;
}

export function FiltresRetours({
  filtres,
  recherche,
  onRecherche,
  onChange,
  pointDeVente,
}: {
  filtres: FiltresAvis;
  /** Saisie en cours (envoyée au serveur après une courte pause). */
  recherche: string;
  onRecherche: (v: string) => void;
  onChange: (maj: Partial<FiltresAvis>) => void;
  pointDeVente: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Rechercher</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Rechercher un numéro, un prénom, un mot…"
            className={`${classeChamp} pl-9`}
          />
        </label>
        <ChampListe
          label="Ressenti"
          valeur={filtres.ressenti}
          onChange={(v) => onChange({ ressenti: v as FiltresAvis["ressenti"] })}
          vide="Tous"
          options={RESSENTIS.map((r) => ({ valeur: r, libelle: LIBELLE_RESSENTI[r] }))}
          className="min-w-[150px]"
        />
        <ChampListe
          label="Statut"
          valeur={filtres.statut}
          onChange={(v) => onChange({ statut: v as FiltresAvis["statut"] })}
          vide="Tous"
          options={STATUTS.map((s) => ({ valeur: s, libelle: LIBELLE_STATUT[s] }))}
          className="min-w-[150px]"
        />
        {!pointDeVente && <FiltreStore valeur={filtres.store} onChange={(v) => onChange({ store: v })} />}
        <ChampListe
          label="Période"
          valeur={filtres.periode}
          onChange={(v) => onChange({ periode: v as PeriodeAvis })}
          options={PERIODES.map((p) => ({ valeur: p.valeur, libelle: p.libelle }))}
          className="min-w-[160px]"
        />
      </div>
      {filtres.en_retard && (
        <div>
          <button
            type="button"
            onClick={() => onChange({ en_retard: false })}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C2410C] bg-white px-3 py-1 text-xs font-semibold text-[#9A3412] hover:bg-orange-50"
            aria-label="Retirer le filtre Échéance dépassée"
          >
            Échéance dépassée
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
