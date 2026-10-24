"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { useDashboardStore } from "@/store/dashboardStore";
import LivreursHeader from "./LivreursHeader";
import LivreursList from "./LivreursList";
import LivreursTabs, { LIVREURS_TABS, type LivreursTab } from "./LivreursTabs";

import { BandeauRestaurants } from "../../../../features/courses/components/BandeauRestaurants";
import LivreurDetails from "../../../../features/livreurs/components/detail-livreur";
import { LivreursDuJour } from "../../../../features/livreurs/components/LivreursDuJour";
import { livreursKeys, useLivreursList } from "../../../../features/livreurs/hook/use-livreurs";
import { useDelivererLiveLocationsQuery } from "../../../../features/livreurs/queries/deliverer-live.query";
import { getLivreurById } from "../../../../features/livreurs/services/livreur.service";
import type { IDelivererLive } from "../../../../features/livreurs/types/deliverer-live.type";
import type {
  Livreur,
  LivreursQueryFilters,
} from "../../../../features/livreurs/types/livreur.types";

/**
 * Module Livreurs (admin et suivi des livraisons), conception du 24/10, 10.2.
 *
 * Deux vues sous le titre :
 *  - « Aujourd'hui » : par restaurant, l'état de chaque livreur, sa place
 *    dans la file, son planning du jour, son temps en ligne et ses courses ;
 *  - « Comptes » : le tableau des comptes (Tous, À valider, Actifs,
 *    Suspendus, Refusés).
 * Le bandeau des restaurants sert de filtre aux deux (le même que Courses et
 * Commandes).
 *
 * Toucher un livreur ouvre sa fiche (`view === 'view'`). Un livreur s'ouvre
 * aussi depuis un autre écran (« Voir le livreur » d'une course, ligne
 * Livreurs de Commandes) par `openLivreur` du tableau de bord
 * (`pendingLivreurId`).
 */

type Vue = "AUJOURDHUI" | "COMPTES";

const VUES: { cle: Vue; libelle: string }[] = [
  { cle: "AUJOURDHUI", libelle: "Aujourd'hui" },
  { cle: "COMPTES", libelle: "Comptes" },
];

export default function Livreurs() {
  const {
    livreurs: { view, selectedItem, filters },
    selectedRestaurantId,
    setSectionView,
    setSelectedItem,
    setFilter,
  } = useDashboardStore();
  const pendingLivreurId = useDashboardStore((s) => s.pendingLivreurId);
  const clearPendingLivreur = useDashboardStore((s) => s.clearPendingLivreur);
  const openLivreur = useDashboardStore((s) => s.openLivreur);
  const queryClient = useQueryClient();

  const vue: Vue = filters?.vue === "COMPTES" ? "COMPTES" : "AUJOURDHUI";
  const [tab, setTab] = useState<LivreursTab>("TOUS");
  const [search, setSearch] = useState("");
  const restaurantId = selectedRestaurantId ?? undefined;

  const statusFilter: LivreursQueryFilters["status"] | undefined =
    tab === "TOUS" ? undefined : tab;

  const filtersComptes: LivreursQueryFilters = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(restaurantId ? { restaurant_id: restaurantId } : {}),
      limit: 50,
    }),
    [statusFilter, search, restaurantId],
  );

  const comptesVisibles = view === "list" && vue === "COMPTES";
  const { data, isLoading } = useLivreursList(filtersComptes, comptesVisibles);
  const livreurs = data?.items ?? [];

  // État de chaque livreur (pause, course, appli) pour le tableau des comptes
  const { data: liveLocations } = useDelivererLiveLocationsQuery(
    { restaurantId, includeOffline: true },
    { enabled: comptesVisibles },
  );

  const liveMap = useMemo<Map<string, IDelivererLive>>(() => {
    const m = new Map<string, IDelivererLive>();
    (liveLocations ?? []).forEach((l) => m.set(l.id, l));
    return m;
  }, [liveLocations]);

  const counts = useMemo(() => {
    const c: Partial<Record<LivreursTab, number>> = { TOUS: data?.total };
    LIVREURS_TABS.forEach((t) => {
      if (t.key === "TOUS") return;
      c[t.key] = livreurs.filter((l) => l.status === t.key).length;
    });
    return c;
  }, [data?.total, livreurs]);

  // Livreur demandé par un autre écran : lu, puis sa fiche s'ouvre.
  useEffect(() => {
    if (!pendingLivreurId) return;
    let annule = false;
    queryClient
      .fetchQuery({
        queryKey: livreursKeys.detail(pendingLivreurId),
        queryFn: () => getLivreurById(pendingLivreurId),
        staleTime: 30 * 1000,
      })
      .then((livreur) => {
        if (annule) return;
        setSelectedItem("livreurs", livreur);
        setSectionView("livreurs", "view");
        clearPendingLivreur();
      })
      .catch((e: Error) => {
        if (annule) return;
        toast.error(e.message);
        clearPendingLivreur();
      });
    return () => {
      annule = true;
    };
  }, [pendingLivreurId, queryClient, setSelectedItem, setSectionView, clearPendingLivreur]);

  const openDetail = (livreur: Livreur) => {
    setSelectedItem("livreurs", livreur);
    setSectionView("livreurs", "view");
  };

  const backToList = () => {
    setSectionView("livreurs", "list");
  };

  const detailTitle = selectedItem
    ? `${(selectedItem as Livreur).first_name ?? ""} ${(selectedItem as Livreur).last_name ?? ""}`.trim() ||
      (selectedItem as Livreur).reference ||
      "Détails du livreur"
    : "Détails du livreur";

  return (
    <div className="flex-1 p-4">
      {/* Header unifié : gère list (search) et view (bouton retour + titre) */}
      <LivreursHeader
        currentView={view === "view" ? "view" : "list"}
        onBack={backToList}
        onSearch={setSearch}
        detailTitle={detailTitle}
      />

      {view === "list" && (
        <div className="space-y-4">
          <div
            role="tablist"
            className="flex w-fit items-center rounded-[12px] bg-[#f4f4f5] px-2"
            style={{ minHeight: 40 }}
          >
            {VUES.map((v, idx) => {
              const actif = vue === v.cle;
              return (
                <button
                  key={v.cle}
                  type="button"
                  role="tab"
                  aria-selected={actif}
                  onClick={() => setFilter("livreurs", "vue", v.cle)}
                  className={`inline-flex items-center whitespace-nowrap rounded-[12px] px-5 py-1 text-[11px] font-bold transition-colors focus:outline-none lg:text-[14px] ${
                    actif ? "bg-[#F17922] text-white" : "bg-transparent font-normal text-[#71717A]"
                  } ${idx === 0 ? "" : "ml-1"}`}
                  style={{ minWidth: 75, height: 30 }}
                >
                  {v.libelle}
                </button>
              );
            })}
          </div>

          <BandeauRestaurants />

          {vue === "AUJOURDHUI" ? (
            <LivreursDuJour restaurantId={selectedRestaurantId} recherche={search} onOuvrir={openLivreur} />
          ) : (
            <div>
              <LivreursTabs selected={tab} onSelect={setTab} counts={counts} />
              <LivreursList
                livreurs={livreurs}
                isLoading={isLoading}
                onView={openDetail}
                liveMap={liveMap}
                unSeulRestaurant={!!restaurantId}
              />
            </div>
          )}
        </div>
      )}

      {view === "view" && selectedItem && (
        <LivreurDetails selectedItem={selectedItem as Livreur} />
      )}
    </div>
  );
}
