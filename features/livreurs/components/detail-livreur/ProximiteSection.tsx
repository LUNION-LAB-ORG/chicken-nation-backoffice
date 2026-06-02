"use client";

import React from "react";
import { MapPin, Navigation } from "lucide-react";

import { useRestaurantListQuery } from "../../../restaurants/queries/restaurant-list.query";
import { haversineKm } from "../../utils/distance";
import type { Livreur } from "../../types/livreur.types";

interface ProximiteSectionProps {
  livreur: Livreur;
}

/**
 * Classe les restaurants par PROXIMITÉ du lieu d'habitation du livreur
 * (distance Haversine, croissante) pour aider l'admin à l'affecter au plus proche.
 * Si le domicile n'est pas renseigné, affiche un état vide.
 */
const ProximiteSection: React.FC<ProximiteSectionProps> = ({ livreur }) => {
  const home = livreur.home_location;
  const { data, isLoading } = useRestaurantListQuery({ limit: 100 });

  const ranked = React.useMemo(() => {
    if (!home) return [];
    return (data?.data ?? [])
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        isAssigned: r.id === livreur.restaurant_id,
        distanceKm: haversineKm(home, {
          lat: r.latitude as number,
          lng: r.longitude as number,
        }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [home, data, livreur.restaurant_id]);

  return (
    <div className="mb-6">
      <p className="text-[18px] font-medium text-[#F17922] mb-3">
        Restaurants par proximité
      </p>

      {livreur.home_address && (
        <p className="text-xs text-[#71717A] mb-2 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#F17922]" />
          Domicile : {livreur.home_address}
        </p>
      )}

      {!home ? (
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#A1A1AA]" />
          <p className="text-sm text-[#A1A1AA] italic">
            Lieu d&apos;habitation non renseigné par le livreur.
          </p>
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
          <p className="text-sm text-[#71717A]">Calcul des distances…</p>
        </div>
      ) : ranked.length === 0 ? (
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
          <p className="text-sm text-[#A1A1AA] italic">
            Aucun restaurant géolocalisé.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E4E4E7] bg-white divide-y divide-[#F4F4F5] overflow-hidden">
          {ranked.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-3 p-3 ${r.isAssigned ? "bg-[#F17922]/5" : ""}`}
            >
              <div className="h-8 w-8 rounded-lg bg-[#F17922]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#F17922]">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#18181B] truncate">
                  {r.name}
                  {r.isAssigned && (
                    <span className="ml-2 text-[10px] font-bold text-[#F17922] uppercase">
                      Affecté
                    </span>
                  )}
                </p>
                {r.address && (
                  <p className="text-xs text-[#71717A] truncate">{r.address}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-[#F17922] flex-shrink-0">
                <Navigation className="w-3.5 h-3.5" />
                <span className="text-sm font-bold">
                  {r.distanceKm.toFixed(1)} km
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProximiteSection;
