"use client";

import React, { useMemo } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { AlertCircle, MapIcon } from "lucide-react";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";

import type { CourseWithAttempts } from "../../types/course.types";

interface Props {
  course: CourseWithAttempts;
}

const containerStyle = {
  width: "100%",
  height: "280px",
  borderRadius: "16px",
};

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

/**
 * Carte du trajet de la course : marker resto + markers numérotés par delivery
 * + polyline. Utilise le context Google Maps déjà configuré dans le backoffice.
 *
 * Régression historique : `bounds.extend()` plantait avec `not a number` quand
 * une commande sans coords (legacy) était dans la course. Le crash dans `onLoad`
 * cascadait en `google is not defined` parce que le script Google se déchargeait
 * pendant que l'error boundary tentait de re-render. Fix : valider STRICTEMENT
 * lat/lng via `toLatLng()` avant tout usage Google Maps.
 */
export function CourseMapView({ course }: Props) {
  // ⚠ Le context expose `isScriptLoaded` (pas `isLoaded`).
  const { isScriptLoaded } = useGoogleMaps();

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

  // Polyline = enchaînement resto → stops valides. On garantit que TOUS les
  // points sont des LatLng valides puisque `restoCoords` et `stops` ont déjà
  // passé le filtre `toLatLng`.
  const polylinePath = useMemo<LatLng[]>(() => {
    if (!restoCoords) return [];
    if (stops.length === 0) return [restoCoords];
    return [restoCoords, ...stops.map((s) => ({ lat: s.lat, lng: s.lng }))];
  }, [restoCoords, stops]);

  const center = restoCoords ?? { lat: 5.36, lng: -4.01 }; // Abidjan par défaut

  if (!isScriptLoaded) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
        <div className="h-[280px] bg-gray-50 rounded-xl animate-pulse" />
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
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <MapIcon className="w-4 h-4 text-[#F17922]" />
        <h3 className="text-sm font-bold text-gray-900">
          Trajet — {stops.length} arrêt{stops.length > 1 ? "s" : ""}
        </h3>
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

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={(map) => {
          // `polylinePath` ne contient QUE des coords valides → safe.
          // Si vide ou un seul point, pas besoin de fitBounds (le `center`
          // + `zoom` initial suffisent).
          if (polylinePath.length < 2) return;
          try {
            const bounds = new google.maps.LatLngBounds();
            polylinePath.forEach((p) => bounds.extend(p));
            map.fitBounds(bounds, 60);
          } catch (err) {
            // Fallback ultra-défensif : si Google râle pour une raison
            // imprévue, on ne crash pas le composant entier.
            console.warn("[CourseMapView] fitBounds failed:", err);
          }
        }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        }}
      >
        <MarkerF
          position={restoCoords}
          label={{ text: "R", color: "white", fontSize: "11px", fontWeight: "700" }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: "#F17922",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 3,
          }}
        />
        {stops.map((s) => (
          <MarkerF
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            label={{
              text: String(s.index),
              color: "white",
              fontSize: "11px",
              fontWeight: "700",
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: "#4FCB71",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 3,
            }}
          />
        ))}
        {polylinePath.length > 1 && (
          <PolylineF
            path={polylinePath}
            options={{
              strokeColor: "#F17922",
              strokeOpacity: 0.8,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
