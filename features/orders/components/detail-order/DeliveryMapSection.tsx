"use client";

import React, { useMemo } from "react";
import { Clock, Navigation } from "lucide-react";

import {
  RouteMapCanvas,
  formatDistance,
  formatDuration,
} from "../../../maps/components/RouteMapCanvas";
import { useDirectionsQuery } from "../../../maps/queries/directions.query";
import { OrderTable } from "../../types/ordersTable.types";

/**
 * Carte de la livraison d'une COMMANDE (drawer « En cours », détail commande).
 *
 * Fine couche au-dessus de `RouteMapCanvas` (features/maps) : elle extrait les
 * deux points depuis l'`OrderTable` (coordonnées du restaurant + JSON d'adresse
 * du client) et délègue tout le rendu — trajet dessiné, pins mobiles, fond
 * épuré, recadrage, caches Google (proxy backend Redis + React Query 10 min).
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

export function DeliveryMapCanvas({
  order,
  height = 280,
}: {
  order: OrderTable;
  height?: number;
}) {
  const { resto, client } = useMemo(() => getDeliveryPoints(order), [order]);

  if (!resto && !client) return null;

  return (
    <>
      <RouteMapCanvas
        resto={resto}
        client={client}
        restoLabel={order.restaurantName}
        clientLabel={order.address}
        height={height}
      />
      {!client && (
        <p className="mt-2 text-[11px] text-[#C0392B]">
          Adresse du client sans coordonnées GPS.
        </p>
      )}
    </>
  );
}

/**
 * Distance et temps de trajet estimé (trafic compris), affichés SOUS l'adresse
 * du client — visibles sans déplier la carte.
 *
 * Même requête (même clé de cache) que la carte : le trajet est récupéré UNE
 * fois via le proxy backend (Redis) + cache React Query 10 min, et la carte le
 * réutilise tel quel quand on la déplie. Ouvrir le drawer coûte donc au plus
 * UN appel Directions par commande et par 10 minutes.
 */
export function DeliveryRouteSummary({
  order,
  className = "",
}: {
  order: OrderTable;
  className?: string;
}) {
  const { resto, client } = useMemo(() => getDeliveryPoints(order), [order]);
  const params = useMemo(
    () => (resto && client ? { origin: resto, destination: client } : null),
    [resto, client],
  );
  const { data: route, isLoading } = useDirectionsQuery(
    order.orderType === "À livrer" ? params : null,
  );

  if (order.orderType !== "À livrer" || !params) return null;

  if (isLoading) {
    return (
      <span
        className={`inline-block h-4 w-36 rounded bg-gray-100 animate-pulse ${className}`}
      />
    );
  }
  if (!route) return null;

  return (
    <span
      className={`inline-flex items-center gap-3 text-xs font-semibold text-gray-700 ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <Navigation className="w-3.5 h-3.5 text-[#F17922]" />
        {formatDistance(route.distanceMeters)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-[#F17922]" />
        {formatDuration(route.durationSeconds)} de trajet
      </span>
    </span>
  );
}
