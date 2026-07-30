"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { clientHouseMarkerIcon, restaurantMarkerIcon } from "./marker-icons";
import { useDirectionsQuery } from "../queries/directions.query";

/**
 * Carte générique restaurant → client avec le TRAJET ROUTIER dessiné.
 *
 * Composant purement présentationnel : il reçoit deux points (l'un ou l'autre
 * peut manquer) et se débrouille — un seul pin = centrage simple, deux pins =
 * recadrage sur les pins + le tracé entier. Utilisé par le drawer « En cours »
 * (via `DeliveryMapCanvas`) et par le formulaire de création de commande.
 *
 * Sobriété API Google :
 *  - l'itinéraire passe par le PROXY BACKEND (clé serveur, cache Redis 3 min)
 *    et est mis en cache côté client 10 min (React Query). Un appelant qui
 *    interroge la même paire origin/destination partage la même requête ;
 *  - en attendant l'itinéraire (ou s'il échoue), une ligne droite pointillée
 *    relie les deux points — jamais d'appel superflu, jamais d'écran vide.
 */

export interface RouteLatLng {
  lat: number;
  lng: number;
}

/** Fond de carte épuré : commerces, POI, transports masqués. */
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

export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${Math.round(m)} m`;
}

export function formatDuration(s: number): string {
  return `${Math.max(1, Math.round(s / 60))} min`;
}

interface RouteMapCanvasProps {
  resto: RouteLatLng | null;
  client: RouteLatLng | null;
  restoLabel?: string;
  clientLabel?: string;
  height?: number;
  /** Légende pins sous la carte (nom du resto + adresse). */
  showLegend?: boolean;
}

export function RouteMapCanvas({
  resto,
  client,
  restoLabel,
  clientLabel,
  height = 280,
  showLegend = true,
}: RouteMapCanvasProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { isScriptLoaded } = useGoogleMaps();

  // Trajet routier — uniquement quand les DEUX points existent.
  const routeParams = useMemo(
    () => (resto && client ? { origin: resto, destination: client } : null),
    [resto, client],
  );
  const { data: route } = useDirectionsQuery(routeParams);
  const routePath = route?.path && route.path.length > 1 ? route.path : null;

  // Recadrage : les pins + LE TRAJET entier (une route qui contourne une
  // lagune sort largement du rectangle des deux points — sans ça, le tracé
  // serait coupé). Appliqué à l'onLoad ET à l'arrivée de l'itinéraire.
  const fitAll = useCallback(
    (map: google.maps.Map) => {
      const pts: RouteLatLng[] = [
        ...(resto ? [resto] : []),
        ...(client ? [client] : []),
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
    [resto, client, routePath],
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

  if (!resto && !client) return null;
  const center = resto ?? client ?? { lat: 5.348, lng: -4.027 };

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
            resto &&
            client && (
              <PolylineF
                path={[resto, client]}
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

          {resto && <MarkerF position={resto} icon={restoIcon} title={restoLabel} />}
          {client && <MarkerF position={client} icon={clientIcon} title={clientLabel} />}
        </GoogleMap>
      </div>

      {showLegend && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#71717A]">
          {resto && (
            <span className="inline-flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/map/restaurant-marker.png"
                alt=""
                className="h-4 w-auto"
              />
              {restoLabel ?? "Restaurant"}
            </span>
          )}
          {client && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#F17922] bg-white text-[9px]">
                🏠
              </span>
              <span className="truncate max-w-[240px]">
                {clientLabel ?? "Client"}
              </span>
            </span>
          )}
        </div>
      )}
    </>
  );
}
