"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { Clock, Navigation } from "lucide-react";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
  clientHouseMarkerIcon,
  restaurantMarkerIcon,
} from "../../../maps/components/marker-icons";
import { useDirectionsQuery } from "../../../maps/queries/directions.query";
import { OrderTable } from "../../types/ordersTable.types";

/**
 * Carte de la livraison : restaurant → client, avec le TRAJET ROUTIER dessiné.
 *
 * Mêmes repères visuels que l'application livreur (pin restaurant PNG partagé,
 * maison liserée orange). Fond de carte ÉPURÉ : commerces, transports et
 * points d'intérêt masqués — seul le trajet doit ressortir.
 *
 * Sobriété API Google, à tous les étages :
 *  - la carte ne se monte que dépliée (l'appelant contrôle) → 0 tuile avant ;
 *  - l'itinéraire passe par le PROXY BACKEND (clé serveur, cache Redis) et il
 *    est aussi mis en cache côté client 10 min (React Query) : rouvrir la même
 *    commande ne rappelle pas Google ;
 *  - en attendant l'itinéraire (ou s'il échoue), une ligne droite pointillée
 *    relie les deux points — jamais d'appel superflu, jamais d'écran vide.
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

/**
 * Fond de carte épuré : commerces, POI, transports et reliefs masqués.
 * Le regard doit aller au trajet, pas aux pharmacies du quartier.
 */
const CLEAN_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.man_made", stylers: [{ visibility: "simplified" }] },
];

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "cooperative",
  clickableIcons: false,
  styles: CLEAN_MAP_STYLES,
};

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${Math.round(m)} m`;
}
function formatDuration(s: number): string {
  return `${Math.max(1, Math.round(s / 60))} min`;
}

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

  // Trajet routier via le proxy backend (clé serveur + cache Redis + cache
  // React Query 10 min). Uniquement quand les DEUX points existent.
  const routeParams = useMemo(
    () =>
      restoCoords && clientCoords
        ? { origin: restoCoords, destination: clientCoords }
        : null,
    [restoCoords, clientCoords],
  );
  const { data: route } = useDirectionsQuery(routeParams);
  const routePath = route?.path && route.path.length > 1 ? route.path : null;

  // Recadrage : les deux pins + LE TRAJET entier (une route qui contourne une
  // lagune sort largement du rectangle des deux points — sans ça, le tracé
  // serait coupé). Appliqué à l'onLoad ET à l'arrivée de l'itinéraire.
  const fitAll = useCallback(
    (map: google.maps.Map) => {
      const pts: LatLng[] = [
        ...(restoCoords ? [restoCoords] : []),
        ...(clientCoords ? [clientCoords] : []),
        ...(routePath ?? []),
      ];
      if (pts.length === 0) return;
      try {
        if (pts.length === 1) {
          map.setCenter(pts[0]);
          map.setZoom(15);
          return;
        }
        const bounds = new google.maps.LatLngBounds();
        pts.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, 48);
      } catch {
        /* fitBounds peut jeter avant le premier rendu — sans conséquence */
      }
    },
    [restoCoords, clientCoords, routePath],
  );

  useEffect(() => {
    if (mapRef.current && isScriptLoaded) fitAll(mapRef.current);
  }, [isScriptLoaded, fitAll]);

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
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: `${height}px` }}
          center={center}
          zoom={14}
          options={MAP_OPTIONS}
          onLoad={(map) => {
            mapRef.current = map;
            // fitBounds DANS onLoad : l'effet peut s'exécuter avant que la
            // carte existe, auquel cas il ne recadre rien.
            fitAll(map);
          }}
          onUnmount={() => {
            mapRef.current = null;
          }}
        >
          {/* Trajet routier réel ; en attendant (ou en cas d'échec Google),
              ligne droite pointillée — on voit toujours le lien resto→client. */}
          {routePath ? (
            <PolylineF
              path={routePath}
              options={{
                strokeColor: "#F17922",
                strokeOpacity: 0.95,
                strokeWeight: 5,
              }}
            />
          ) : (
            restoCoords &&
            clientCoords && (
              <PolylineF
                path={[restoCoords, clientCoords]}
                options={{
                  strokeOpacity: 0,
                  icons: [
                    {
                      icon: {
                        path: "M 0,-1 0,1",
                        strokeOpacity: 0.6,
                        strokeColor: "#F17922",
                        scale: 3,
                      },
                      offset: "0",
                      repeat: "14px",
                    },
                  ],
                }}
              />
            )
          )}

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
      </div>

      {/* Légende + résumé du trajet (distance • durée, trafic compris). */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#71717A]">
        {restoCoords && (
          <span className="inline-flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/map/restaurant-marker.png"
              alt=""
              className="h-4 w-auto"
            />
            {order.restaurantName}
          </span>
        )}
        {clientCoords ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#F17922] bg-white text-[9px]">
              🏠
            </span>
            <span className="truncate max-w-[240px]">{order.address}</span>
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
