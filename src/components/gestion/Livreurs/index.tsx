"use client";

import React, { useMemo, useState } from "react";

import { useDashboardStore } from "@/store/dashboardStore";
import LivreursHeader from "./LivreursHeader";
import LivreursList from "./LivreursList";
import LivreursTabs, { LIVREURS_TABS, type LivreursTab } from "./LivreursTabs";

import { DelivererLiveMap } from "../../../../features/livreurs/components/DelivererLiveMap";
import LivreurDetails from "../../../../features/livreurs/components/detail-livreur";
import { useLivreursList } from "../../../../features/livreurs/hook/use-livreurs";
import type {
  Livreur,
  LivreursQueryFilters,
} from "../../../../features/livreurs/types/livreur.types";
import { SchedulePlanningView } from "../../../../features/schedule/components/SchedulePlanningView";

/**
 * Module Livreurs (admin backoffice).
 *
 * Navigation :
 *  - view === 'list' : liste avec tabs + search
 *  - view === 'view' : page détail (sections + lightbox photos/documents)
 *
 * État piloté par `dashboardStore.livreurs` (view + selectedItem) — pattern
 * cohérent avec Orders. Les actions (valider/refuser/suspendre/affecter)
 * ouvrent des modals depuis la page détail.
 */
export default function Livreurs() {
  const {
    livreurs: { view, selectedItem },
    setSectionView,
    setSelectedItem,
  } = useDashboardStore();

  const [tab, setTab] = useState<LivreursTab>("TOUS");
  const [search, setSearch] = useState("");

  // Les tabs virtuelles "CARTE_LIVE" / "PLANNING" ne sont pas des filtres de statut.
  const statusFilter: LivreursQueryFilters["status"] | undefined =
    tab === "TOUS" || tab === "CARTE_LIVE" || tab === "PLANNING" ? undefined : tab;

  const filters: LivreursQueryFilters = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      limit: 50,
    }),
    [statusFilter, search],
  );

  // Pas besoin de fetcher la liste sur les tabs virtuelles
  const { data, isLoading } = useLivreursList(
    filters,
    view === "list" && tab !== "CARTE_LIVE" && tab !== "PLANNING",
  );
  const livreurs = data?.items ?? [];

  const counts = useMemo(() => {
    const c: Partial<Record<LivreursTab, number>> = { TOUS: data?.total };
    LIVREURS_TABS.forEach((t) => {
      if (t.key === "TOUS") return;
      c[t.key] = livreurs.filter((l) => l.status === t.key).length;
    });
    return c;
  }, [data?.total, livreurs]);

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
        <>
          <LivreursTabs selected={tab} onSelect={setTab} counts={counts} />
          {tab === "CARTE_LIVE" ? (
            <DelivererLiveMap />
          ) : tab === "PLANNING" ? (
            <SchedulePlanningView />
          ) : (
            <LivreursList
              livreurs={livreurs}
              isLoading={isLoading}
              onView={openDetail}
              onMenu={openDetail}
            />
          )}
        </>
      )}

      {view === "view" && selectedItem && (
        <LivreurDetails selectedItem={selectedItem as Livreur} />
      )}
    </div>
  );
}
