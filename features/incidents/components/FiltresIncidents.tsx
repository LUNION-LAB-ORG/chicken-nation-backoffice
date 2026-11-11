import React, { useMemo } from "react";
import { Search } from "lucide-react";
import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";
import { useReglagesIncidentsQuery } from "../queries/incident.query";
import type { FiltresIncidents as Filtres } from "../types/incident.types";
import { GRAVITES, LIBELLE_GRAVITE, LIBELLE_POLE, POLES } from "../utils/incident";
import { classeChamp } from "./Elements";

function Liste({
  label,
  valeur,
  onChange,
  options,
}: {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  options: { valeur: string; libelle: string }[];
}) {
  return (
    <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium text-gray-500">
      {label}
      <select value={valeur} onChange={(e) => onChange(e.target.value)} className={`${classeChamp} cursor-pointer`}>
        <option value="">Tous</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Restaurants actifs ; absent pour un point de vente, borné au sien par le serveur. */
export function FiltreRestaurant({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const { data } = useRestaurantListQuery();
  const options = useMemo(
    () =>
      ((data?.data ?? []) as { id: string; name: string; entity_status?: string }[])
        .filter((r) => !r.entity_status || r.entity_status === "ACTIVE")
        .map((r) => ({ valeur: r.id, libelle: r.name })),
    [data],
  );
  return <Liste label="Restaurant" valeur={valeur} onChange={onChange} options={options} />;
}

/**
 * Filtres communs au tableau et à l'historique des incidents : recherche
 * (code, référence, nom, numéro), restaurant, responsable, catégorie, gravité.
 * `children` : les filtres propres à l'écran (statut, origine, période).
 */
export function FiltresIncidents({
  filtres,
  recherche,
  onRecherche,
  onChange,
  pointDeVente,
  children,
}: {
  filtres: Filtres;
  /** Saisie en cours (envoyée au serveur après une courte pause). */
  recherche: string;
  onRecherche: (v: string) => void;
  onChange: (maj: Partial<Filtres>) => void;
  pointDeVente: boolean;
  children?: React.ReactNode;
}) {
  const { data: reglages } = useReglagesIncidentsQuery();
  const categories = (reglages?.categories ?? []).map((c) => ({ valeur: c.id, libelle: c.nom }));
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="relative min-w-[220px] flex-1">
        <span className="sr-only">Rechercher</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Code, commande, nom ou numéro"
          className={`${classeChamp} pl-9`}
        />
      </label>
      {!pointDeVente && <FiltreRestaurant valeur={filtres.restaurantId ?? ""} onChange={(v) => onChange({ restaurantId: v })} />}
      <Liste
        label="Responsable"
        valeur={filtres.pole ?? ""}
        onChange={(v) => onChange({ pole: v as Filtres["pole"] })}
        options={POLES.map((p) => ({ valeur: p, libelle: LIBELLE_POLE[p] }))}
      />
      <Liste label="Catégorie" valeur={filtres.categorieId ?? ""} onChange={(v) => onChange({ categorieId: v })} options={categories} />
      <Liste
        label="Gravité"
        valeur={filtres.gravite ?? ""}
        onChange={(v) => onChange({ gravite: v as Filtres["gravite"] })}
        options={GRAVITES.map((g) => ({ valeur: g, libelle: LIBELLE_GRAVITE[g] }))}
      />
      {children}
    </div>
  );
}

export { Liste as ListeFiltre };
