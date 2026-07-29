"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { ChevronDown, ChevronUp, Map as MapIcon } from "lucide-react";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
  clientHouseMarkerIcon,
  restaurantMarkerIcon,
} from "../../../maps/components/marker-icons";
import { OrderTable } from "../../types/ordersTable.types";

/**
 * Carte PLIABLE de la livraison — drawer du détail commande.
 *
 * Même principe que « Carte live des livreurs » de la page Courses : un
 * en-tête cliquable, la carte ne se monte que dépliée (aucun coût Google tant
 * qu'on ne l'ouvre pas). Carte STATIQUE : deux pins seulement, le restaurant
 * (pastille « R ») et le client (maison), soit les mêmes repères visuels que
 * l'application livreur. Le recadrage englobe les deux pins d'un coup.
 */

interface LatLng {
  lat: number;
  lng: number;
}

/** Coordonnées du client depuis le JSON d'adresse de la commande (tolérant). */
function parseClientCoords(rawAddress: string | null): LatLng | null {
  if (!rawAddress) return null;
  try {
    const parsed = JSON.parse(rawAddress) as Record<string, unknown>;
    const rawLat = parsed.latitude ?? parsed.lat;
    const rawLng = parsed.longitude ?? parsed.lng;
    const lat = typeof rawLat === "string" ? Number(rawLat) : (rawLat as number);
    const lng = typeof rawLng === "string" ? Number(rawLng) : (rawLng as number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function toLatLng(
  lat?: number | null,
  lng?: number | null,
): LatLng | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "cooperative",
  clickableIcons: false,
  // Deux pins proches : sans plafond, fitBounds zoomerait à la rue près.
  maxZoom: 16,
};

const DeliveryMapSection: React.FC<{ order: OrderTable }> = ({ order }) => {
  const [open, setOpen] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { isScriptLoaded } = useGoogleMaps();

  const restoCoords = useMemo(
    () => toLatLng(order.restaurantLatitude, order.restaurantLongitude),
    [order.restaurantLatitude, order.restaurantLongitude],
  );
  const clientCoords = useMemo(
    () => parseClientCoords(order.rawAddress ?? null),
    [order.rawAddress],
  );

  // Recadrage sur les DEUX pins d'un coup (padding généreux pour que les
  // marqueurs ne collent pas les bords). Un seul pin → centrage simple.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !open || !isScriptLoaded) return;
    const pts = [restoCoords, clientCoords].filter((p): p is LatLng => p !== null);
    if (pts.length === 0) return;
    try {
      if (pts.length === 1) {
        map.setCenter(pts[0]);
        map.setZoom(15);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      pts.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 56);
    } catch {
      /* fitBounds peut jeter avant le premier rendu — sans conséquence */
    }
  }, [open, isScriptLoaded, restoCoords, clientCoords]);

  // Icônes construites après chargement du script (elles référencent google.maps.*).
  const restoIcon = useMemo(
    () => (isScriptLoaded ? restaurantMarkerIcon() : undefined),
    [isScriptLoaded],
  );
  const clientIcon = useMemo(
    () => (isScriptLoaded ? clientHouseMarkerIcon() : undefined),
    [isScriptLoaded],
  );

  // Uniquement pour les commandes à livrer, et seulement si on a au moins un point.
  if (order.orderType !== "À livrer") return null;
  if (!restoCoords && !clientCoords) return null;

  const center = restoCoords ?? clientCoords ?? { lat: 5.348, lng: -4.027 };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#F17922] hover:opacity-80 transition cursor-pointer"
      >
        <MapIcon className="w-4 h-4" />
        Carte de la livraison
        {open ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {open && (
        <div className="mt-3">
          {!isScriptLoaded ? (
            <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <>
              <GoogleMap
                mapContainerStyle={{
                  width: "100%",
                  height: "300px",
                  borderRadius: "12px",
                }}
                center={center}
                zoom={14}
                options={MAP_OPTIONS}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                onUnmount={() => {
                  mapRef.current = null;
                }}
              >
                {restoCoords && (
                  <MarkerF
                    position={restoCoords}
                    icon={restoIcon}
                    title={order.restaurantName}
                  />
                )}
                {clientCoords && (
                  <MarkerF
                    position={clientCoords}
                    icon={clientIcon}
                    title={order.address}
                  />
                )}
              </GoogleMap>

              {/* Légende : mêmes repères que l'app livreur. */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#71717A]">
                {restoCoords && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#F17922] text-[9px] font-bold text-white">
                      R
                    </span>
                    {order.restaurantName}
                  </span>
                )}
                {clientCoords ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#F17922] bg-white text-[9px]">
                      🏠
                    </span>
                    <span className="truncate max-w-[260px]">{order.address}</span>
                  </span>
                ) : (
                  <span className="text-[#C0392B]">
                    Adresse du client sans coordonnées GPS.
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryMapSection;
