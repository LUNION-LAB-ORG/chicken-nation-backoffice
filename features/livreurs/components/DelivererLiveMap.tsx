"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
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

// ─── Garde safeLocation ──────────────────────────────────────────────────────

function safeLocation(loc: unknown): { lat: number; lng: number } | null {
  if (!loc || typeof loc !== "object") return null;
  const obj = loc as Record<string, unknown>;
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

// ─── Metadata disponibilité ──────────────────────────────────────────────────

interface IAvailabilityMeta {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const AVAILABILITY_META: Record<IDelivererAvailability, IAvailabilityMeta> = {
  available:   { label: "Disponible",  color: "#17C964", bgColor: "#DCFCE7", textColor: "#166534", Icon: Zap },
  in_course:   { label: "En course",   color: "#007AFF", bgColor: "#DBEAFE", textColor: "#1e40af", Icon: Truck },
  paused:      { label: "En pause",    color: "#F5A524", bgColor: "#FEF3C7", textColor: "#92400E", Icon: Pause },
  auto_paused: { label: "Auto-pause",  color: "#EF4444", bgColor: "#FEE2E2", textColor: "#991B1B", Icon: AlertOctagon },
  offline:     { label: "Hors-ligne",  color: "#9CA3AF", bgColor: "#F3F4F6", textColor: "#4B5563", Icon: Power },
};

const ASIDE_FILTERS: { key: IDelivererAvailability | "all"; label: string }[] = [
  { key: "all",         label: "Tous" },
  { key: "available",  label: "Disponible" },
  { key: "in_course",  label: "En course" },
  { key: "paused",     label: "En pause" },
  { key: "offline",    label: "Hors-ligne" },
];

const VEHICULE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MOTO: Bike, VELO: Bike, VOITURE: Car,
};

// ─── Initiales ───────────────────────────────────────────────────────────────

function getInitials(first?: string | null, last?: string | null): string {
  const f = (first ?? "").trim()[0] ?? "";
  const l = (last  ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

// ─── Avatar livreur ───────────────────────────────────────────────────────────

function DelivererAvatar({
  image,
  initials,
  color,
  size = 36,
  ring = false,
}: {
  image?: string | null;
  initials: string;
  color: string;
  size?: number;
  ring?: boolean;
}) {
  const [imgError, setImgError] = React.useState(false);
  const dim = `${size}px`;
  const ringClass = ring ? "ring-2 ring-white" : "";

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={initials}
        width={size}
        height={size}
        className={`rounded-full object-cover flex-shrink-0 ${ringClass}`}
        style={{ width: dim, height: dim }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${ringClass}`}
      style={{ width: dim, height: dim, backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// ─── Icônes de markers ───────────────────────────────────────────────────────

function buildMarkerIcon(
  availability: IDelivererAvailability,
  initials: string,
  selected: boolean,
): google.maps.Icon {
  const meta = AVAILABILITY_META[availability];
  const size = selected ? 48 : 36;
  const r    = selected ? 20 : 14;
  const cx   = size / 2;

  const svg = selected
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="${meta.color}" stroke="white" stroke-width="3.5"/>
        <text x="${cx}" y="${cx + 5}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="13" font-weight="bold">${initials}</text>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="${meta.color}" stroke="white" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cx}" r="4" fill="white"/>
       </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(cx, cx),
  };
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function DelivererLiveMap({ restaurantId }: { restaurantId?: string }) {
  const { isScriptLoaded } = useGoogleMaps();
  const [includeOffline, setIncludeOffline]   = useState(false);
  const [asideFilter, setAsideFilter]         = useState<IDelivererAvailability | "all">("all");
  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { data: livreurs, isLoading, isError } = useDelivererLiveLocationsQuery({
    restaurantId,
    includeOffline,
  });

  const normalized = useMemo(() => (livreurs ?? []).map((l) => ({
    ...l,
    location: safeLocation(l.location),
  })), [livreurs]);

  const visible = useMemo(() => normalized.filter((l) => l.location !== null), [normalized]);

  const center = useMemo(() => {
    if (visible.length === 0) return ABIDJAN_CENTER;
    const sum = visible.reduce((a, l) => ({ lat: a.lat + l.location!.lat, lng: a.lng + l.location!.lng }), { lat: 0, lng: 0 });
    return { lat: sum.lat / visible.length, lng: sum.lng / visible.length };
  }, [visible]);

  const asideList = useMemo(() =>
    normalized.filter((l) => asideFilter === "all" || l.availability === asideFilter),
    [normalized, asideFilter],
  );

  const selected = normalized.find((l) => l.id === selectedId) ?? null;

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleSelectDeliverer = (l: IDelivererLive) => {
    setSelectedId(l.id);
    if (l.location) {
      mapRef.current?.panTo(l.location);
      mapRef.current?.setZoom(16);
    }
  };

  const hiddenInvalid = normalized.length - visible.length;

  if (!isScriptLoaded) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-2xl">
        <p className="text-sm text-gray-500">Chargement de la carte…</p>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-red-50 rounded-2xl">
        <p className="text-sm text-red-600">Impossible de charger les positions.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[640px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Aside gauche ─────────────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/60">

        {/* Header aside */}
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Livreurs live</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isLoading ? "Chargement…" : `${visible.length} géolocalisé${visible.length > 1 ? "s" : ""}`}
                {hiddenInvalid > 0 && (
                  <span className="text-amber-500"> · {hiddenInvalid} masqué{hiddenInvalid > 1 ? "s" : ""}</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeOffline((v) => !v)}
              title={includeOffline ? "Exclure les hors-ligne" : "Inclure les hors-ligne"}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                includeOffline ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compteurs par statut */}
          <div className="flex gap-1.5 flex-wrap mt-2">
            {Object.entries(AVAILABILITY_META).map(([key, meta]) => {
              const c = normalized.filter((l) => l.availability === key).length;
              if (c === 0) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: meta.bgColor, color: meta.color }}
                >
                  <meta.Icon className="w-2.5 h-2.5" />{c}
                </span>
              );
            })}
          </div>
        </div>

        {/* Filtres disponibilité */}
        <div className="px-3 py-2 border-b border-gray-100 bg-white flex gap-1 flex-wrap">
          {ASIDE_FILTERS.map((f) => {
            const isActive = asideFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setAsideFilter(f.key)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? "bg-[#F17922] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Liste livreurs */}
        <div className="flex-1 overflow-y-auto py-1">
          {asideList.length === 0 ? (
            <p className="text-center text-xs text-gray-400 mt-8">Aucun livreur</p>
          ) : (
            asideList.map((l) => {
              const meta     = AVAILABILITY_META[l.availability];
              const initials = getInitials(l.first_name, l.last_name);
              const fullName = [l.first_name, l.last_name].filter(Boolean).join(" ") || "Livreur";
              const isActive = selectedId === l.id;
              const hasLoc   = l.location !== null;

              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => hasLoc && handleSelectDeliverer(l)}
                  disabled={!hasLoc}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                    isActive
                      ? "bg-orange-50"
                      : hasLoc
                      ? "hover:bg-gray-100 cursor-pointer"
                      : "opacity-50 cursor-default"
                  }`}
                >
                  {/* Avatar : photo si dispo, sinon initiales */}
                  <DelivererAvatar
                    image={l.image}
                    initials={initials}
                    color={meta.color}
                    size={36}
                    ring
                  />

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-semibold truncate ${isActive ? "text-[#F17922]" : "text-gray-900"}`}>
                      {fullName}
                    </p>
                    {l.restaurant && (
                      <p className="text-[10px] text-gray-400 truncate flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        {l.restaurant.name}
                      </p>
                    )}
                  </div>

                  {/* Badge statut */}
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.bgColor, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Carte ────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {/* Légende en surimpression */}
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 px-3 py-1.5 flex gap-2 flex-wrap text-[11px]">
          {Object.entries(AVAILABILITY_META).map(([key, meta]) => (
            <span key={key} className="inline-flex items-center gap-1 font-semibold"
              style={{ color: meta.color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: meta.color }} />
              {meta.label}
            </span>
          ))}
          <span className="text-gray-400">· refresh 15 s</span>
        </div>

        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={13}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
          }}
        >
          {visible.map((l) => (
            <MarkerF
              key={l.id}
              position={l.location!}
              onClick={() => handleSelectDeliverer(l)}
              icon={buildMarkerIcon(l.availability, getInitials(l.first_name, l.last_name), selectedId === l.id)}
              zIndex={selectedId === l.id ? 10 : 1}
            />
          ))}
          {selected?.location && selectedId && (
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

// ─── InfoWindow détaillée ─────────────────────────────────────────────────────

function LivreurInfoCard({ livreur }: { livreur: IDelivererLive }) {
  const meta      = AVAILABILITY_META[livreur.availability];
  const VehicleIcon = livreur.type_vehicule ? VEHICULE_ICON[livreur.type_vehicule] : null;
  const fullName  = [livreur.first_name, livreur.last_name].filter(Boolean).join(" ") || "Livreur";
  const initials  = getInitials(livreur.first_name, livreur.last_name);
  const { data: scoring } = useDelivererScoringInfoQuery(livreur.id);

  return (
    <div className="p-1 min-w-[260px]">
      <div className="flex items-start gap-2.5 mb-2">
        {/* Avatar : photo si dispo, sinon initiales */}
        <DelivererAvatar
          image={livreur.image}
          initials={initials}
          color={meta.color}
          size={36}
        />
        <div className="flex-1 min-w-0">
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
          <meta.Icon className="w-2.5 h-2.5" />{meta.label}
        </span>
      </div>

      <dl className="space-y-1 text-[11px]">
        {VehicleIcon && livreur.type_vehicule && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Véhicule</dt>
            <dd className="font-semibold text-gray-800 flex items-center gap-1">
              <VehicleIcon className="w-3 h-3" />{livreur.type_vehicule}
            </dd>
          </div>
        )}
        {livreur.speed_kmh !== null && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Vitesse</dt>
            <dd className="font-semibold text-gray-800">{Math.round(livreur.speed_kmh)} km/h</dd>
          </div>
        )}
        {livreur.queue_rank !== null && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Rang FIFO</dt>
            <dd className="font-semibold text-gray-800">#{livreur.queue_rank}</dd>
          </div>
        )}
        {scoring?.ranking?.position && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500 flex items-center gap-1"><Award className="w-3 h-3" />Rang scoring</dt>
            <dd className="font-semibold text-gray-800">#{scoring.ranking.position}/{scoring.ranking.totalCandidates}</dd>
          </div>
        )}
        {scoring?.scoring && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Score</dt>
            <dd className="font-semibold font-mono text-gray-800">{scoring.scoring.currentScore.toFixed(3)}</dd>
          </div>
        )}
        {scoring && scoring.refusals.countInWindow > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Refus</dt>
            <dd className="text-orange-600 font-semibold">{scoring.refusals.countInWindow}/{scoring.refusals.threshold}</dd>
          </div>
        )}
        {livreur.active_course && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Course active</dt>
            <dd className="font-semibold text-gray-800">#{livreur.active_course.reference}</dd>
          </div>
        )}
        {livreur.location_at && (
          <div className="flex items-center justify-between text-gray-400">
            <dt>Dernier GPS</dt>
            <dd>{new Date(livreur.location_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
