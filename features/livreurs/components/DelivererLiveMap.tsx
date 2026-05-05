"use client";

import React, { useMemo, useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF } from "@react-google-maps/api";
import {
  AlertOctagon,
  Award,
  Bike,
  Car,
  EyeOff,
  MapPin,
  Pause,
  Power,
  TrendingDown,
  Truck,
  Zap,
} from "lucide-react";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";

import { useDelivererLiveLocationsQuery } from "../queries/deliverer-live.query";
import { useDelivererScoringInfoQuery } from "../queries/deliverer-scoring.query";
import type {
  IDelivererAvailability,
  IDelivererLive,
} from "../types/deliverer-live.type";

const ABIDJAN_CENTER = { lat: 5.348, lng: -4.027 };

/**
 * Garde stricte sur `location` retourné par le backend.
 *
 * Le champ Prisma `last_location` est typé `JsonValue` côté serveur — donc
 * en pratique la forme reçue peut être :
 *  - `{ lat: number, lng: number }` (format attendu)
 *  - `{ latitude, longitude }` (vieux livreurs en base)
 *  - `{ lat: "5.36", lng: "-4.0" }` (string si bug de remontée GPS)
 *  - `null` (livreur jamais géolocalisé)
 *  - `{}` (entrée corrompue)
 *
 * On ne fait confiance qu'à la forme `{ lat: finite, lng: finite }`.
 * Tout le reste → null → marker masqué (au lieu de crash Google Maps).
 */
function safeLocation(loc: unknown): { lat: number; lng: number } | null {
  if (!loc || typeof loc !== "object") return null;
  const obj = loc as Record<string, unknown>;
  // Accepte les deux conventions : {lat, lng} (mobile) ou {latitude, longitude} (legacy)
  const rawLat = obj.lat ?? obj.latitude;
  const rawLng = obj.lng ?? obj.longitude;
  const lat = typeof rawLat === "string" ? Number(rawLat) : rawLat;
  const lng = typeof rawLng === "string" ? Number(rawLng) : rawLng;
  if (typeof lat !== "number" || !Number.isFinite(lat)) return null;
  if (typeof lng !== "number" || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;
  return { lat, lng };
}

interface IAvailabilityMeta {
  label: string;
  color: string;
  bgColor: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const AVAILABILITY_META: Record<IDelivererAvailability, IAvailabilityMeta> = {
  available: { label: "Disponible", color: "#17C964", bgColor: "#DCFCE7", Icon: Zap },
  in_course: { label: "En course", color: "#007AFF", bgColor: "#DBEAFE", Icon: Truck },
  paused: { label: "En pause", color: "#F5A524", bgColor: "#FEF3C7", Icon: Pause },
  auto_paused: { label: "Auto-pause", color: "#EF4444", bgColor: "#FEE2E2", Icon: AlertOctagon },
  offline: { label: "Hors-ligne", color: "#9CA3AF", bgColor: "#F3F4F6", Icon: Power },
};

const VEHICULE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MOTO: Bike,
  VELO: Bike,
  VOITURE: Car,
};

/**
 * Dashboard carte live des livreurs (P6c).
 *
 * - Markers colorés selon `availability` (vert/bleu/ambre/rouge/gris)
 * - Clic sur marker → InfoWindow avec détails (vitesse, cap, course active)
 * - Refetch auto toutes les 15 s via query (cf. `useDelivererLiveLocationsQuery`)
 * - Fit bounds auto quand les positions changent
 */
export function DelivererLiveMap({ restaurantId }: { restaurantId?: string }) {
  // ⚠ Le context expose `isScriptLoaded` (pas `isLoaded`) — ne pas confondre
  // avec la prop `isLoaded` du hook `useJsApiLoader` de @react-google-maps/api.
  const { isScriptLoaded } = useGoogleMaps();
  // Toggle "Voir aussi les livreurs hors-ligne" — utile pour debug : si le
  // backend filtre `location_fresh` à 5 min et qu'aucun livreur n'a une app
  // active, la carte reste vide. Activer ce toggle force l'inclusion des
  // livreurs avec dernier GPS plus ancien.
  const [includeOffline, setIncludeOffline] = useState(false);
  const { data: livreurs, isLoading, isError } = useDelivererLiveLocationsQuery({
    restaurantId,
    includeOffline,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Normalise les livreurs : `safeLocation()` filtre les coords malformées
  // pour éviter `InvalidValueError` au render. Si la coord est invalide,
  // on garde le livreur mais avec `location: null` (il ne sera pas affiché).
  const normalizedLivreurs = useMemo(() => {
    return (livreurs ?? []).map((l) => ({
      ...l,
      location: safeLocation(l.location),
    }));
  }, [livreurs]);

  const visibleLivreurs = useMemo(
    () => normalizedLivreurs.filter((l) => l.location !== null),
    [normalizedLivreurs],
  );

  const center = useMemo(() => {
    if (visibleLivreurs.length === 0) return ABIDJAN_CENTER;
    // Barycentre simple sur les livreurs avec coord valide
    const sum = visibleLivreurs.reduce(
      (acc, l) => ({
        lat: acc.lat + l.location!.lat,
        lng: acc.lng + l.location!.lng,
      }),
      { lat: 0, lng: 0 },
    );
    return {
      lat: sum.lat / visibleLivreurs.length,
      lng: sum.lng / visibleLivreurs.length,
    };
  }, [visibleLivreurs]);

  const selected = normalizedLivreurs.find((l) => l.id === selectedId) ?? null;

  if (!isScriptLoaded) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-2xl">
        <p className="text-sm text-gray-500">Chargement de la carte…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-red-50 rounded-2xl">
        <p className="text-sm text-red-600">Impossible de charger les positions.</p>
      </div>
    );
  }

  // Compteur diagnostic : combien de livreurs remontés mais avec coord invalide
  // ou null. Affiché dans le header si > 0 pour aider l'ops à comprendre
  // pourquoi tel livreur n'apparaît pas.
  const hiddenInvalid = normalizedLivreurs.length - visibleLivreurs.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <LiveMapHeader
        count={visibleLivreurs.length}
        isLoading={isLoading}
        livreurs={normalizedLivreurs}
        hiddenInvalid={hiddenInvalid}
        includeOffline={includeOffline}
        onToggleIncludeOffline={() => setIncludeOffline((v) => !v)}
      />
      <div className="relative">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "600px" }}
          center={center}
          zoom={13}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {visibleLivreurs.map((l) => (
            <MarkerF
              key={l.id}
              position={l.location!}
              onClick={() => setSelectedId(l.id)}
              icon={buildMarkerIcon(l.availability)}
            />
          ))}
          {selected && selected.location && (
            <InfoWindowF
              position={selected.location}
              onCloseClick={() => setSelectedId(null)}
            >
              <LivreurInfoCard livreur={selected} />
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

// ─── Header de la carte ─────────────────────────────────────────

function LiveMapHeader({
  count,
  isLoading,
  livreurs,
  hiddenInvalid,
  includeOffline,
  onToggleIncludeOffline,
}: {
  count: number;
  isLoading: boolean;
  livreurs: IDelivererLive[];
  hiddenInvalid: number;
  includeOffline: boolean;
  onToggleIncludeOffline: () => void;
}) {
  const statsByAvailability: Partial<Record<IDelivererAvailability, number>> = {};
  for (const l of livreurs) {
    statsByAvailability[l.availability] = (statsByAvailability[l.availability] ?? 0) + 1;
  }
  return (
    <div className="px-5 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Carte live des livreurs</h3>
          <p className="text-xs text-gray-500">
            {isLoading && !livreurs.length ? "Chargement…" : `${count} livreur(s) géolocalisé(s)`}
            {hiddenInvalid > 0 && (
              <>
                {" · "}
                <span className="text-amber-600">
                  {hiddenInvalid} masqué{hiddenInvalid > 1 ? "s" : ""} (coords invalides)
                </span>
              </>
            )}
            {" · "}
            <span className="text-gray-400">refresh auto toutes les 15 s</span>
          </p>
        </div>
        {/* Toggle "Inclure hors-ligne" — utile pour débugger une carte vide :
            si le backend filtre `location_fresh` à 5 min et qu'aucun livreur
            n'a une app active, ce toggle force l'inclusion. */}
        <button
          type="button"
          onClick={onToggleIncludeOffline}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            includeOffline
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <EyeOff className="w-3 h-3" />
          {includeOffline ? "Inclut hors-ligne" : "Inclure hors-ligne"}
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(AVAILABILITY_META).map(([key, meta]) => {
          const count = statsByAvailability[key as IDelivererAvailability] ?? 0;
          if (count === 0) return null;
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: meta.bgColor, color: meta.color }}
            >
              <meta.Icon className="w-3 h-3" />
              {meta.label} · {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── InfoWindow détaillée ────────────────────────────────────────

function LivreurInfoCard({ livreur }: { livreur: IDelivererLive }) {
  const meta = AVAILABILITY_META[livreur.availability];
  const VehicleIcon = livreur.type_vehicule ? VEHICULE_ICON[livreur.type_vehicule] : null;
  const fullName = [livreur.first_name, livreur.last_name].filter(Boolean).join(" ") || "Livreur";

  // Fetch on-demand du scoring détaillé quand l'InfoWindow s'ouvre
  // — 1 query DB supplémentaire par clic, raisonnable car 1 seul livreur sélectionné à la fois.
  const { data: scoring } = useDelivererScoringInfoQuery(livreur.id);

  return (
    <div className="p-1 min-w-[260px]">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{fullName}</p>
          {livreur.restaurant && (
            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {livreur.restaurant.name}
            </p>
          )}
        </div>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: meta.bgColor, color: meta.color }}
        >
          <meta.Icon className="w-2.5 h-2.5" />
          {meta.label}
        </span>
      </div>

      <dl className="space-y-1 text-[11px]">
        {VehicleIcon && livreur.type_vehicule && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Véhicule</dt>
            <dd className="text-gray-800 font-semibold flex items-center gap-1">
              <VehicleIcon className="w-3 h-3" /> {livreur.type_vehicule}
            </dd>
          </div>
        )}
        {livreur.speed_kmh !== null && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Vitesse</dt>
            <dd className="text-gray-800 font-semibold">{Math.round(livreur.speed_kmh)} km/h</dd>
          </div>
        )}
        {livreur.queue_rank !== null && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Rang FIFO</dt>
            <dd className="text-gray-800 font-semibold">#{livreur.queue_rank}</dd>
          </div>
        )}
        {scoring?.ranking?.position && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500 flex items-center gap-1">
              <Award className="w-3 h-3" />
              Rang scoring
            </dt>
            <dd className="text-gray-800 font-semibold">
              #{scoring.ranking.position}/{scoring.ranking.totalCandidates}
            </dd>
          </div>
        )}
        {scoring?.scoring && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Score composite</dt>
            <dd className="text-gray-800 font-semibold font-mono">
              {scoring.scoring.currentScore.toFixed(3)}
            </dd>
          </div>
        )}
        {scoring && scoring.refusals.countInWindow > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Refus récents
            </dt>
            <dd className="text-orange-600 font-semibold">
              {scoring.refusals.countInWindow}/{scoring.refusals.threshold}
            </dd>
          </div>
        )}
        {livreur.active_course && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Course</dt>
            <dd className="text-gray-800 font-semibold">
              #{livreur.active_course.reference} · {livreur.active_course.deliveries.length} liv.
            </dd>
          </div>
        )}
        {livreur.auto_pause_until && (
          <div className="flex items-center justify-between text-red-600">
            <dt>Pause auto jusqu&apos;à</dt>
            <dd className="font-semibold">
              {new Date(livreur.auto_pause_until).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </dd>
          </div>
        )}
        {livreur.location_at && (
          <div className="flex items-center justify-between text-gray-400">
            <dt>Dernier GPS</dt>
            <dd>
              {new Date(livreur.location_at).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </dd>
          </div>
        )}
      </dl>

      {scoring && scoring.reasons.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
            Contexte
          </p>
          <ul className="space-y-0.5">
            {scoring.reasons.slice(0, 2).map((r) => (
              <li key={r} className="text-[10px] text-gray-600">
                • {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Icône SVG des markers ────────────────────────────────────────

function buildMarkerIcon(availability: IDelivererAvailability): google.maps.Icon {
  const meta = AVAILABILITY_META[availability];
  // SVG inline pour un marker coloré avec contour blanc + pulse visuel simple
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
  <circle cx="18" cy="18" r="14" fill="${meta.color}" stroke="white" stroke-width="3"/>
  <circle cx="18" cy="18" r="5" fill="white"/>
</svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(36, 36),
    anchor: new google.maps.Point(18, 18),
  };
}
