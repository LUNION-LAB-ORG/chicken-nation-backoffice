"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useDashboardStore } from "@/store/dashboardStore";
import LivreursHeader from "./LivreursHeader";
import LivreursList from "./LivreursList";
import LivreursTabs, { LIVREURS_TABS, type LivreursTab } from "./LivreursTabs";

import { DelivererLiveMap } from "../../../../features/livreurs/components/DelivererLiveMap";
import LivreurDetails from "../../../../features/livreurs/components/detail-livreur";
import { useLivreursList } from "../../../../features/livreurs/hook/use-livreurs";
import { useDelivererLiveLocationsQuery } from "../../../../features/livreurs/queries/deliverer-live.query";
import { useRestaurantListQuery } from "../../../../features/restaurants/queries/restaurant-list.query";
import type { IDelivererLive } from "../../../../features/livreurs/types/deliverer-live.type";
import type {
  Livreur,
  LivreursQueryFilters,
} from "../../../../features/livreurs/types/livreur.types";

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
  const [restaurantId, setRestaurantId] = useState<string | undefined>(undefined);

  // La tab virtuelle "CARTE_LIVE" n'est pas un filtre de statut.
  const statusFilter: LivreursQueryFilters["status"] | undefined =
    tab === "TOUS" || tab === "CARTE_LIVE" ? undefined : tab;

  const filters: LivreursQueryFilters = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(restaurantId ? { restaurant_id: restaurantId } : {}),
      limit: 50,
    }),
    [statusFilter, search, restaurantId],
  );

  // Pas besoin de fetcher la liste sur la tab virtuelle carte
  const { data, isLoading } = useLivreursList(
    filters,
    view === "list" && tab !== "CARTE_LIVE",
  );
  const livreurs = data?.items ?? [];

  // Live data partagée entre liste et carte
  const { data: liveLocations } = useDelivererLiveLocationsQuery({
    restaurantId,
    includeOffline: true,
  });

  const liveMap = useMemo<Map<string, IDelivererLive>>(() => {
    const m = new Map<string, IDelivererLive>();
    (liveLocations ?? []).forEach((l) => m.set(l.id, l));
    return m;
  }, [liveLocations]);

  // Restaurants pour le sélecteur
  const { data: restaurantData } = useRestaurantListQuery({ limit: 100 });
  const restaurants = restaurantData?.data ?? [];

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
          {/* Tabs + sélecteur restaurant sur la même ligne */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <LivreursTabs selected={tab} onSelect={setTab} counts={counts} />
            </div>
            <div className="flex-shrink-0 pb-2">
              <select
                value={restaurantId ?? ""}
                onChange={(e) => setRestaurantId(e.target.value || undefined)}
                className="text-sm border border-[#E4E4E7] rounded-lg px-3 py-1.5 bg-white text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
              >
                <option value="">Tous les restaurants</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tab === "CARTE_LIVE" ? (
            <DelivererLiveMap restaurantId={restaurantId} />
          ) : (
            <LivreursList
              livreurs={livreurs}
              isLoading={isLoading}
              onView={openDetail}
              liveMap={liveMap}
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
