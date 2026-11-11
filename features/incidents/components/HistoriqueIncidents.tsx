"use client";

import React, { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Pagination } from "@/components/ui/pagination";
import { incidentAPI } from "../apis/incident.api";
import { useListeIncidentsQuery } from "../queries/incident.query";
import { useIncidentsUi } from "../stores/incident-ui.store";
import type { FiltresHistorique, IncidentLigne } from "../types/incident.types";
import {
  LIBELLE_GESTE,
  LIBELLE_ORIGINE,
  LIBELLE_POLE,
  LIBELLE_STATUT,
  ORIGINES,
  STATUTS,
  filtresNets,
  formatJourHeure,
  formatMontant,
  messageErreurIncident,
} from "../utils/incident";
import { PastilleGravite, PastilleStatut, classeChamp } from "./Elements";
import { FiltresIncidents, ListeFiltre } from "./FiltresIncidents";

const PAR_PAGE = 20;
const ENTETES = ["Signalé le", "Incident", "Client · commande", "Restaurant", "Gravité", "Responsable", "Statut", "Geste"];

function Table({ lignes, onOuvrir, avecRestaurant }: { lignes: IncidentLigne[]; onOuvrir: (id: string) => void; avecRestaurant: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
      <table className="w-full min-w-[960px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-gray-500">
            {ENTETES.filter((e) => avecRestaurant || e !== "Restaurant").map((e) => (
              <th key={e} className="px-3.5 py-3 font-semibold">
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((i) => (
            <tr
              key={i.id}
              tabIndex={0}
              onClick={() => onOuvrir(i.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOuvrir(i.id);
                }
              }}
              className="cursor-pointer border-b border-slate-50 align-top transition-colors last:border-0 hover:bg-orange-50/40 focus:bg-orange-50/40 focus:outline-none"
            >
              <td className="whitespace-nowrap px-3.5 py-3 text-gray-800">{formatJourHeure(i.created_at)}</td>
              <td className="max-w-[280px] px-3.5 py-3">
                <div className="font-semibold text-gray-900">{i.categorie.nom}</div>
                <div className="truncate text-gray-500">{i.extrait}</div>
                <div className="text-xs text-gray-400">
                  {i.code} · {LIBELLE_ORIGINE[i.origine]}
                </div>
              </td>
              <td className="whitespace-nowrap px-3.5 py-3">
                <div className="font-semibold text-gray-900">{i.client.nom}</div>
                <div className="text-gray-500">{i.commande.reference}</div>
              </td>
              {avecRestaurant && <td className="whitespace-nowrap px-3.5 py-3 text-gray-800">{i.restaurant.name}</td>}
              <td className="whitespace-nowrap px-3.5 py-3">
                <PastilleGravite gravite={i.gravite} court />
              </td>
              <td className="whitespace-nowrap px-3.5 py-3 text-gray-800">
                {LIBELLE_POLE[i.pole]}
                {i.agent && <div className="text-gray-500">{i.agent.fullname}</div>}
              </td>
              <td className="whitespace-nowrap px-3.5 py-3">
                <PastilleStatut statut={i.statut} />
                {i.en_retard && <div className="mt-1 text-xs font-semibold text-[#B91C1C]">En retard</div>}
              </td>
              <td className="whitespace-nowrap px-3.5 py-3 text-gray-800">
                {i.geste === "BON" && i.bon_montant ? `Bon de ${formatMontant(i.bon_montant)}` : i.geste ? LIBELLE_GESTE[i.geste] : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * HISTORIQUE DES INCIDENTS : tous les incidents, clôturés compris, avec les
 * filtres du tableau plus le statut, l'origine et la période. Une ligne ouvre
 * la fiche. Export CSV pour le siège (mêmes filtres).
 */
export function HistoriqueIncidents({ pointDeVente, peutExporter }: { pointDeVente: boolean; peutExporter: boolean }) {
  const ouvrirFiche = useIncidentsUi((s) => s.ouvrirFiche);
  const [filtres, setFiltres] = useState<FiltresHistorique>({ page: 1, limit: PAR_PAGE });
  const [saisie, setSaisie] = useState("");
  const [exportEnCours, setExportEnCours] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFiltres((f) => (f.recherche === saisie.trim() ? f : { ...f, recherche: saisie.trim(), page: 1 })), 350);
    return () => clearTimeout(t);
  }, [saisie]);

  const requete = filtresNets(filtres);
  const { data, isPending, isError, error, isFetching } = useListeIncidentsQuery(requete);
  // Tout filtre changé ramène à la première page.
  const changer = (maj: Partial<FiltresHistorique>) => setFiltres((f) => ({ ...f, ...maj, page: 1 }));

  const exporter = async () => {
    setExportEnCours(true);
    try {
      await incidentAPI.exporter(requete);
    } catch (e) {
      toast.error(messageErreurIncident(e, "Export impossible."));
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FiltresIncidents filtres={filtres} recherche={saisie} onRecherche={setSaisie} onChange={changer} pointDeVente={pointDeVente}>
        <ListeFiltre
          label="Statut"
          valeur={filtres.statut ?? ""}
          onChange={(v) => changer({ statut: v as FiltresHistorique["statut"] })}
          options={STATUTS.map((s) => ({ valeur: s, libelle: LIBELLE_STATUT[s] }))}
        />
        <ListeFiltre
          label="Origine"
          valeur={filtres.origine ?? ""}
          onChange={(v) => changer({ origine: v as FiltresHistorique["origine"] })}
          options={ORIGINES.map((o) => ({ valeur: o, libelle: LIBELLE_ORIGINE[o] }))}
        />
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
          Du
          <input type="date" value={filtres.du ?? ""} max={filtres.au || undefined} onChange={(e) => changer({ du: e.target.value })} className={classeChamp} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
          Au
          <input type="date" value={filtres.au ?? ""} min={filtres.du || undefined} onChange={(e) => changer({ au: e.target.value })} className={classeChamp} />
        </label>
        {peutExporter && (
          <button
            type="button"
            onClick={exporter}
            disabled={exportEnCours}
            className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 hover:border-[#F17922] hover:text-[#F17922] disabled:opacity-60"
          >
            {exportEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exporter CSV
          </button>
        )}
      </FiltresIncidents>

      {isPending ? (
        <div className="flex justify-center rounded-xl border border-slate-100 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#F17922]" />
        </div>
      ) : isError && !data ? (
        <div className="rounded-xl border border-slate-100 bg-white py-12 text-center text-sm text-red-600">
          {messageErreurIncident(error, "Impossible de lire les incidents.")}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white py-12 text-center text-sm text-gray-500">
          Aucun incident ne correspond à ces filtres.
        </div>
      ) : (
        <Table lignes={data.data} onOuvrir={ouvrirFiche} avecRestaurant={!pointDeVente} />
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={(page) => setFiltres((f) => ({ ...f, page }))}
          isLoading={isFetching}
        />
      )}
    </div>
  );
}
