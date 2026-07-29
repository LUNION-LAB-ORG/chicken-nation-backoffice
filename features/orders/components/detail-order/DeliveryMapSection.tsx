"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
  clientHouseMarkerIcon,
  restaurantMarkerIcon,
} from "../../../maps/components/marker-icons";
import { OrderTable } from "../../types/ordersTable.types";

/**
 * Carte STATIQUE de la livraison : deux pins seulement, le restaurant
 * (pastille « R ») et le client (maison), soit les mêmes repères visuels que
 * l'application livreur. Le recadrage englobe les deux pins d'un coup.
 *
 * Composant « canvas » sans déclencheur : c'est l'appelant qui décide de
 * l'affordance (chez nous, l'ADRESSE du bloc Client sert de bouton) — la carte
 * ne se monte que dépliée, donc aucune tuile Google chargée tant qu'on ne
 * l'ouvre pas.
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

function toLatLng(lat?: number | null, lng?: number | null): LatLng | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Points géolocalisables d'une commande (restaurant + client). */
export function getDeliveryPoints(order: OrderTable): {
  resto: LatLng | null;
  client: LatLng | null;
} {
  return {
    resto: toLatLng(order.restaurantLatitude, order.restaurantLongitude),
    client: parseClientCoords(order.rawAddress ?? null),
  };
}

/** `true` si la carte a au moins un pin à montrer. */
export function hasDeliveryPoint(order: OrderTable): boolean {
  const { resto, client } = getDeliveryPoints(order);
  return resto !== null || client !== null;
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "cooperative",
  clickableIcons: false,
  // Deux pins proches : sans plafond, fitBounds zoomerait à la rue près.
  maxZoom: 16,
};

export function DeliveryMapCanvas({
  order,
  height = 280,
}: {
  order: OrderTable;
  height?: number;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { isScriptLoaded } = useGoogleMaps();

  const { resto: restoCoords, client: clientCoords } = useMemo(
    () => getDeliveryPoints(order),
    [order],
  );

  // Recadrage sur les DEUX pins d'un coup (padding généreux pour que les
  // marqueurs ne collent pas les bords). Un seul pin → centrage simple.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isScriptLoaded) return;
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
  }, [isScriptLoaded, restoCoords, clientCoords]);

  // Icônes construites après chargement du script (elles référencent google.maps.*).
  const restoIcon = useMemo(
    () => (isScriptLoaded ? restaurantMarkerIcon() : undefined),
    [isScriptLoaded],
  );
  const clientIcon = useMemo(
    () => (isScriptLoaded ? clientHouseMarkerIcon() : undefined),
    [isScriptLoaded],
  );

  if (!restoCoords && !clientCoords) return null;
  const center = restoCoords ?? clientCoords ?? { lat: 5.348, lng: -4.027 };

  if (!isScriptLoaded) {
    return (
      <div
        className="bg-gray-50 rounded-xl animate-pulse"
        style={{ height: `${height}px` }}
      />
    );
  }

  return (
    <>
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: `${height}px`,
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
          <MarkerF position={clientCoords} icon={clientIcon} title={order.address} />
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
  );
}
