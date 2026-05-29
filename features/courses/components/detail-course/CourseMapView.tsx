"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { AlertCircle, Clock, MapIcon, Navigation, Radio } from "lucide-react";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";

import type { CourseStatut, CourseWithAttempts } from "../../types/course.types";
import {
  clientHouseMarkerIcon,
  delivererCourseMarkerIcon,
  restaurantMarkerIcon,
} from "../../../maps/components/marker-icons";
import { AnimatedDelivererMarker } from "../../../maps/components/AnimatedDelivererMarker";
import { useDirectionsQuery } from "../../../maps/queries/directions.query";
import { useDelivererLivePosition } from "../../../maps/hooks/use-deliverer-live-socket";
import type { IGetRouteParams } from "../../../maps/services/directions.service";

interface Props {
  course: CourseWithAttempts;
}

const containerStyle = {
  width: "100%",
  height: "440px",
  borderRadius: "20px",
};

/** Statuts pendant lesquels le livreur bouge → on suit sa position en direct. */
const ACTIVE_STATUTS: CourseStatut[] = ["ACCEPTED", "AT_RESTAURANT", "IN_DELIVERY"];

/**
 * Type étroit pour les coords validées — `lat`/`lng` garantis être des nombres
 * finis. Tout `LatLng` qui sort des helpers ci-dessous est safe à passer
 * à Google Maps sans risquer un `InvalidValueError`.
 */
type LatLng = { lat: number; lng: number };

/**
 * Garde stricte : Google Maps exige des nombres FINIS (pas `null`,
 * `undefined`, `NaN`, `Infinity`, ni des strings). Le DTO type
 * `OrderAddress.latitude` comme `number` mais en pratique l'API renvoie
 * parfois `null`/`undefined` pour les anciennes commandes pré-obligation
 * coords — d'où ce check défensif au site d'usage.
 */
function toLatLng(lat: unknown, lng: unknown): LatLng | null {
  const n1 = typeof lat === "string" ? Number(lat) : lat;
  const n2 = typeof lng === "string" ? Number(lng) : lng;
  if (typeof n1 !== "number" || !Number.isFinite(n1)) return null;
  if (typeof n2 !== "number" || !Number.isFinite(n2)) return null;
  // Bornes Google Maps strictes — au-delà → InvalidValueError aussi.
  if (n1 < -90 || n1 > 90) return null;
  if (n2 < -180 || n2 > 180) return null;
  return { lat: n1, lng: n2 };
}

/** Mètres → « 850 m » / « 1.2 km » / « 14 km ». */
function formatDistance(m: number): string {
  if (!Number.isFinite(m) || m <= 0) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

/** Secondes → « 25 min » / « 1 h 05 ». */
function formatDuration(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return "—";
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h} h ${String(r).padStart(2, "0")}` : `${h} h`;
}

/**
 * Carte HÉRO du trajet de la course (détail de course, backoffice).
 *
 * Reprend le parti pris des apps mobiles :
 *  - tracé ROUTIER réel (Google Directions via backend) au lieu d'une ligne
 *    droite géodésique — fallback ligne claire le temps que la route charge ;
 *  - markers de marque : pastille « R » resto, MAISON client (numérotée en
 *    multi-stops), badge directionnel livreur ;
 *  - livreur EN DIRECT qui GLISSE entre deux pings GPS (socket
 *    `deliverer:location:live`) quand la course est active.
 *
 * Régression historique : `bounds.extend()` plantait avec `not a number` quand
 * une commande sans coords (legacy) était dans la course. Fix : valider
 * STRICTEMENT lat/lng via `toLatLng()` avant tout usage Google Maps.
 */
export function CourseMapView({ course }: Props) {
  // ⚠ Le context expose `isScriptLoaded` (pas `isLoaded`).
  const { isScriptLoaded } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);

  const restoCoords = useMemo(
    () => toLatLng(course.restaurant.latitude, course.restaurant.longitude),
    [course.restaurant.latitude, course.restaurant.longitude],
  );

  // `stops` ne contient QUE les livraisons avec coords valides — on garde
  // séparément le compte des invalides pour pouvoir afficher un avertissement
  // côté UI (sinon les ops ne savent pas pourquoi un marker manque).
  const { stops, invalidCount } = useMemo(() => {
    let invalid = 0;
    const valid = course.deliveries
      .slice()
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map((d) => {
        const coords = toLatLng(d.order.address?.latitude, d.order.address?.longitude);
        if (!coords) {
          invalid += 1;
          return null;
        }
        return {
          id: d.id,
          index: d.sequence_order,
          lat: coords.lat,
          lng: coords.lng,
          label: d.order.reference,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    return { stops: valid, invalidCount: invalid };
  }, [course.deliveries]);

  const multiStop = stops.length > 1;

  // Ligne droite de secours (resto → stops) affichée tant que l'itinéraire
  // routier n'est pas chargé / a échoué — garantit qu'on voit toujours le lien.
  const fallbackPath = useMemo<LatLng[]>(() => {
    if (!restoCoords) return [];
    if (stops.length === 0) return [restoCoords];
    return [restoCoords, ...stops.map((s) => ({ lat: s.lat, lng: s.lng }))];
  }, [restoCoords, stops]);

  // Itinéraire routier : resto → (waypoints) → dernier arrêt.
  const routeParams = useMemo<IGetRouteParams | null>(() => {
    if (!restoCoords || stops.length === 0) return null;
    const coords = stops.map((s) => ({ lat: s.lat, lng: s.lng }));
    const destination = coords[coords.length - 1];
    const waypoints = coords.slice(0, -1);
    return {
      origin: restoCoords,
      destination,
      waypoints: waypoints.length > 0 ? waypoints : undefined,
    };
  }, [restoCoords, stops]);

  const { data: route } = useDirectionsQuery(routeParams);

  const usingRealRoute = !!(route?.path && route.path.length > 1);
  const routePath = usingRealRoute ? route!.path : fallbackPath;

  // Suivi LIVE du livreur : seulement quand la course est en cours ET qu'un
  // livreur est affecté. Sinon `null` → pas d'abonnement socket, pas de marker.
  const isActive = ACTIVE_STATUTS.includes(course.statut);
  const delivererId = isActive ? (course.deliverer?.id ?? null) : null;
  const livePosition = useDelivererLivePosition(delivererId);

  // Icônes de marque — construites uniquement après chargement du script
  // (elles référencent `google.maps.Size`). Mémoïsées pour éviter que
  // `MarkerF` ne redessine les markers statiques à chaque ping live.
  const restoIcon = useMemo(
    () => (isScriptLoaded ? restaurantMarkerIcon() : undefined),
    [isScriptLoaded],
  );
  const stopIcons = useMemo(
    () =>
      isScriptLoaded
        ? stops.map((s) => clientHouseMarkerIcon(multiStop ? { index: s.index } : {}))
        : [],
    [isScriptLoaded, stops, multiStop],
  );
  const delivererIcon = useMemo(
    () => (isScriptLoaded ? delivererCourseMarkerIcon(livePosition?.heading ?? null) : undefined),
    [isScriptLoaded, livePosition?.heading],
  );

  // Recadrage : on suit l'ensemble resto + arrêts + tracé. Volontairement PAS
  // la position live (sinon la carte se recentrerait à chaque ping → pénible).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isScriptLoaded || !restoCoords) return;
    const pts: LatLng[] = [restoCoords, ...stops.map((s) => ({ lat: s.lat, lng: s.lng })), ...routePath];
    if (pts.length < 2) return;
    try {
      const bounds = new google.maps.LatLngBounds();
      pts.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 64);
    } catch (err) {
      console.warn("[CourseMapView] fitBounds failed:", err);
    }
  }, [isScriptLoaded, restoCoords, stops, routePath]);

  const center = restoCoords ?? { lat: 5.36, lng: -4.01 }; // Abidjan par défaut

  if (!isScriptLoaded) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4">
        <div className="h-[440px] bg-gray-50 rounded-[20px] animate-pulse" />
      </div>
    );
  }

  if (!restoCoords) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapIcon className="w-4 h-4 text-[#F17922]" />
          <h3 className="text-sm font-bold text-gray-900">Trajet</h3>
        </div>
        <p className="text-xs text-gray-400 py-8 text-center">
          Coordonnées du restaurant indisponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4">
      {/* En-tête : titre + résumé itinéraire (distance • durée). */}
      <div className="flex items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-[#F17922]" />
          <h3 className="text-sm font-bold text-gray-900">
            Trajet — {stops.length} arrêt{stops.length > 1 ? "s" : ""}
          </h3>
        </div>
        {route && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-[#F17922]" />
              <span className="font-semibold text-gray-700">
                {formatDistance(route.distanceMeters)}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#F17922]" />
              <span className="font-semibold text-gray-700">
                {formatDuration(route.durationSeconds)}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Avertissement si certaines livraisons ont été exclues faute de coords.
          Sans ça, les ops voient "1 arrêt" alors que le drawer en montre 3, et
          ne comprennent pas pourquoi. */}
      {invalidCount > 0 && (
        <div className="flex items-start gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            {invalidCount} livraison{invalidCount > 1 ? "s" : ""} masquée
            {invalidCount > 1 ? "s" : ""} sur la carte (coordonnées manquantes).
          </p>
        </div>
      )}

      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={(map) => {
            mapRef.current = map;
            // Premier cadrage immédiat (l'effet prendra le relais quand la
            // route routière arrivera).
            if (fallbackPath.length < 2) return;
            try {
              const bounds = new google.maps.LatLngBounds();
              fallbackPath.forEach((p) => bounds.extend(p));
              map.fitBounds(bounds, 64);
            } catch (err) {
              console.warn("[CourseMapView] fitBounds failed:", err);
            }
          }}
          onUnmount={() => {
            mapRef.current = null;
          }}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
            styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
          }}
        >
          {/* Tracé : route réelle (orange plein) ou ligne de secours (claire). */}
          {routePath.length > 1 && (
            <PolylineF
              path={routePath}
              options={{
                strokeColor: "#F17922",
                strokeOpacity: usingRealRoute ? 0.9 : 0.4,
                strokeWeight: usingRealRoute ? 5 : 3,
                geodesic: !usingRealRoute,
              }}
            />
          )}

          {/* Restaurant — origine du trajet. */}
          <MarkerF position={restoCoords} icon={restoIcon} zIndex={10} />

          {/* Arrêts client — maisons numérotées (si multi-stops). */}
          {stops.map((s, i) => (
            <MarkerF
              key={s.id}
              position={{ lat: s.lat, lng: s.lng }}
              icon={stopIcons[i]}
              zIndex={20}
            />
          ))}

          {/* Livreur EN DIRECT — glisse entre deux pings GPS. */}
          {livePosition && (
            <AnimatedDelivererMarker
              position={{ lat: livePosition.lat, lng: livePosition.lng }}
              icon={delivererIcon}
              durationMs={5000}
              zIndex={999}
            />
          )}
        </GoogleMap>

        {/* Badge « en direct » + vitesse (overlay haut-gauche). */}
        {livePosition && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur rounded-full shadow-md border border-gray-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F17922] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F17922]" />
            </span>
            <span className="text-[11px] font-bold text-gray-800">En direct</span>
            {typeof livePosition.speedKmh === "number" &&
              Number.isFinite(livePosition.speedKmh) && (
                <span className="text-[11px] text-gray-400">
                  · {Math.round(livePosition.speedKmh)} km/h
                </span>
              )}
          </div>
        )}

        {/* Légende compacte (overlay bas-gauche). */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full shadow-md border border-gray-100">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F17922]" />
            Resto
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-white border-2 border-[#F17922]" />
            Client
          </span>
          {isActive && (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <Radio className="h-3 w-3 text-[#F17922]" />
              Livreur
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
