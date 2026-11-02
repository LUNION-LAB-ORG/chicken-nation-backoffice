"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Pagination } from "@/components/ui/pagination";
import { useDashboardStore } from "@/store/dashboardStore";
import { avisPriveAPI } from "../../apis/avis-prive.api";
import { useDroitsAvis } from "../../hooks/useDroitsAvis";
import { useCompteursAvisQuery, useListeAvisQuery } from "../../queries/avis-prive.query";
import type { FiltresAvis } from "../../types/avis-prive.types";
import { filtresDuCompteur, lireFiltres, messageErreurAvis, requeteDepuisFiltres } from "../../utils/avis-prive";
import { CompteursRetours } from "./CompteursRetours";
import { FiltresRetours } from "./FiltresRetours";
import { TableRetours } from "./TableRetours";

/**
 * Onglet « Retours privés » du module Notes et avis : les avis envoyés depuis
 * la page « Ton avis compte » du site (/fr/avis). Tri du serveur : les
 * « Pas content » non traités d'abord, du plus ancien au plus récent.
 *
 * Les filtres vivent dans le store du tableau de bord (`reviews.filters.retours`) :
 * « Tous les avis » depuis une fiche retrouve la liste telle qu'on l'a laissée.
 */
export function RetoursPrives({ onOuvrir }: { onOuvrir: (id: string) => void }) {
  const { peutExporter, pointDeVente } = useDroitsAvis();
  const brut = useDashboardStore((s) => s.reviews.filters?.retours);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const filtres = useMemo(() => lireFiltres(brut), [brut]);

  const ecrire = (suivants: FiltresAvis) => setFilter("reviews", "retours", suivants);
  const changer = (maj: Partial<FiltresAvis>) => ecrire({ ...filtres, page: 1, ...maj });

  // Recherche envoyée après une courte pause, pas à chaque lettre. Le
  // minuteur relit les filtres du store au moment d'écrire : un autre filtre
  // changé entre-temps n'est pas écrasé.
  const [saisie, setSaisie] = useState(filtres.recherche);
  const [rechercheVue, setRechercheVue] = useState(filtres.recherche);
  if (filtres.recherche !== rechercheVue) {
    // Recherche effacée ailleurs (clic sur un compteur) : le champ suit.
    setRechercheVue(filtres.recherche);
    setSaisie(filtres.recherche);
  }
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);
  const taper = (valeur: string) => {
    setSaisie(valeur);
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      const actuels = lireFiltres(useDashboardStore.getState().reviews.filters?.retours);
      if (actuels.recherche !== valeur) ecrire({ ...actuels, recherche: valeur, page: 1 });
    }, 350);
  };

  const requete = useMemo(() => requeteDepuisFiltres(filtres, pointDeVente), [filtres, pointDeVente]);
  const { data, isLoading, isError, error, isFetching } = useListeAvisQuery(requete);
  const { data: compteurs } = useCompteursAvisQuery(requete.restaurantId);

  const [exportEnCours, setExportEnCours] = useState(false);
  const exporter = async () => {
    setExportEnCours(true);
    try {
      await avisPriveAPI.exporter(requete);
    } catch (e) {
      toast.error(messageErreurAvis(e, "Export impossible"));
    } finally {
      setExportEnCours(false);
    }
  };

  const lignes = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Retours privés envoyés depuis la page « Ton avis compte ». Jamais affichés sur le site.
        </p>
        {peutExporter && (
          <button
            type="button"
            onClick={exporter}
            disabled={exportEnCours}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 hover:border-[#F17922] hover:text-[#F17922] disabled:opacity-60"
          >
            {exportEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exporter CSV
          </button>
        )}
      </div>

      <CompteursRetours compteurs={compteurs} onChoisir={(cle) => ecrire(filtresDuCompteur(cle, filtres))} />

      <FiltresRetours
        filtres={filtres}
        recherche={saisie}
        onRecherche={taper}
        onChange={changer}
        pointDeVente={pointDeVente}
      />

      {isLoading ? (
        <div className="flex justify-center rounded-xl border border-slate-100 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#F17922]" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-slate-100 bg-white py-12 text-center text-sm text-red-600">
          {messageErreurAvis(error)}
        </div>
      ) : lignes.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white py-12 text-center text-sm text-gray-500">
          Aucun avis sur cette période.
        </div>
      ) : (
        <TableRetours lignes={lignes} onOuvrir={onOuvrir} />
      )}

      {data && (
        <Pagination
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={(page) => ecrire({ ...filtres, page })}
          isLoading={isFetching}
        />
      )}
    </div>
  );
}
