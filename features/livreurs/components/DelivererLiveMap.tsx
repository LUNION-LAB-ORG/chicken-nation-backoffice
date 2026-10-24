"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, InfoWindowF } from "@react-google-maps/api";
import {
  AlertOctagon,
  Award,
  BellRing,
  Bike,
  Car,
  EyeOff,
  MapPin,
  Pause,
  Power,
  PowerOff,
  TrendingDown,
  Truck,
  Zap,
} from "lucide-react";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";

import { useDelivererLiveLocationsQuery } from "../queries/deliverer-live.query";
import { useDelivererScoringInfoQuery } from "../queries/deliverer-scoring.query";
import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";
import { AnimatedDelivererMarker } from "../../maps/components/AnimatedDelivererMarker";
import { useDelivererLiveSync } from "../../maps/hooks/use-deliverer-live-socket";
import { useMaintenant } from "../hook/use-maintenant";
import {
  COULEURS_ETAT,
  COULEURS_PRESENCE,
  FILTRES_CARTE,
  NOM_ETAT,
  ORDRE_ETATS,
  correspondAuFiltre,
  etatLivreurAffiche,
  libellePresence,
  presenceAppli,
  rangEtat,
  type EtatAffiche,
  type FiltreCarte,
  type PresenceAppli,
} from "../utils/disponibilite";
import { ICONE_PRESENCE } from "./PresenceAppliLigne";
import type { IDelivererLive } from "../types/deliverer-live.type";
import type { EtatDisponibilite } from "../types/livreur.types";

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

// État par la règle unique du serveur (`disponibilite`, lot 1 du 22/10) :
// « En pause jusqu'à 14 h 32 » et « Hors service » visibles, même sans
// position récente. Libellés et couleurs : `../utils/disponibilite`.
const ICONE_ETAT: Record<EtatDisponibilite, React.ComponentType<{ className?: string }>> = {
  DISPONIBLE: Zap,
  OFFRE_EN_ATTENTE: BellRing,
  EN_COURSE: Truck,
  EN_PAUSE: Pause,
  PAUSE_AUTO: AlertOctagon,
  HORS_SERVICE: Power,
  INACTIF: Power,
  APPLI_FERMEE: PowerOff,
};

/**
 * Livreur de la carte avec son état à l'instant, sa présence sur la carte et
 * son appli (fermée, en arrière-plan, non connectée), null si rien à dire.
 */
type LivreurCarte = IDelivererLive & { affiche: EtatAffiche; surCarte: boolean; appli: PresenceAppli | null };

const ETAT_INCONNU: EtatAffiche = {
  etat: "HORS_SERVICE",
  libelle: "Hors service",
  peutRecevoirOffre: false,
  raison: null,
};

/**
 * Détails sous le nom : l'heure de fin d'une pause, l'absence de position
 * récente, l'appli (« appli fermée · vue il y a 6 min », « en arrière-plan » :
 * les offres lui arrivent alors par notification).
 */
function detailsLivreur(l: LivreurCarte): string {
  const details: string[] = [];
  if (l.affiche.libelle !== NOM_ETAT[l.affiche.etat]) details.push(l.affiche.libelle);
  if (!l.surCarte) details.push(l.location ? "position ancienne" : "sans position");
  if (l.appli) {
    // Le badge dit déjà « Appli fermée » : seule l'heure du dernier signal s'ajoute.
    if (l.affiche.etat === "APPLI_FERMEE") {
      if (l.appli.vue) details.push(l.appli.vue);
    } else {
      details.push(libellePresence(l.appli).toLowerCase());
    }
  }
  return details.join(" · ");
}

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
  etat: EtatDisponibilite,
  initials: string,
  selected: boolean,
): google.maps.Icon {
  const couleur = COULEURS_ETAT[etat].couleur;
  const size = selected ? 48 : 36;
  const r    = selected ? 20 : 14;
  const cx   = size / 2;

  const svg = selected
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="${couleur}" stroke="white" stroke-width="3.5"/>
        <text x="${cx}" y="${cx + 5}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="13" font-weight="bold">${initials}</text>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="${couleur}" stroke="white" stroke-width="2.5"/>
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

  // Branche le temps réel : à chaque ping `deliverer:location:live`, la position
  // du livreur concerné est patchée EN PLACE dans le cache `live-locations` →
  // les markers glissent au lieu de sauter toutes les 15 s. Le polling REST
  // reste actif, mais en simple réconciliation (nouveaux livreurs / dispo).
  useDelivererLiveSync();

  // Positions anciennes sur la carte. La liste montre toujours tout le monde :
  // un livreur en pause ou hors service n'envoie souvent plus sa position.
  const [includeOffline, setIncludeOffline]   = useState(false);
  const [asideFilter, setAsideFilter]         = useState<FiltreCarte>("TOUS");
  const maintenant = useMaintenant(30 * 1000);
  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Le filtre restaurant local (interne à la carte) prend le dessus sur le prop parent.
  const [localRestaurantId, setLocalRestaurantId] = useState<string>(restaurantId ?? "");

  // Synchroniser le state local si le prop change (navigation depuis le parent)
  useEffect(() => {
    setLocalRestaurantId(restaurantId ?? "");
  }, [restaurantId]);

  const { data: restaurantData } = useRestaurantListQuery({ limit: 100 });
  const restaurants = restaurantData?.data ?? [];

  // Utilise le filtre local s'il est défini, sinon le prop parent
  const effectiveRestaurantId = localRestaurantId || restaurantId || undefined;

  const { data: livreurs, isLoading, isError } = useDelivererLiveLocationsQuery({
    restaurantId: effectiveRestaurantId,
    includeOffline: true,
  });

  const normalized = useMemo<LivreurCarte[]>(() => (livreurs ?? []).map((l) => {
    const location = safeLocation(l.location);
    const affiche = etatLivreurAffiche(l, maintenant) ?? ETAT_INCONNU;
    return {
      ...l,
      location,
      affiche,
      surCarte: location !== null && (l.location_fresh || includeOffline),
      appli: presenceAppli(l, affiche.etat, maintenant),
    };
  }), [livreurs, maintenant, includeOffline]);

  const visible = useMemo(() => normalized.filter((l) => l.surCarte), [normalized]);

  // Centre INITIAL figé : on cadre sur le barycentre de la flotte au premier
  // chargement, puis on n'y touche plus. Sans ça, comme les positions bougent
  // désormais à chaque ping socket, un `center` recalculé recentrerait la carte
  // en continu et combattrait le pan de l'utilisateur (et le glissement).
  const initialCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  if (initialCenterRef.current === null && visible.length > 0) {
    const sum = visible.reduce(
      (a, l) => ({ lat: a.lat + l.location!.lat, lng: a.lng + l.location!.lng }),
      { lat: 0, lng: 0 },
    );
    initialCenterRef.current = {
      lat: sum.lat / visible.length,
      lng: sum.lng / visible.length,
    };
  }
  const center = initialCenterRef.current ?? ABIDJAN_CENTER;

  const asideList = useMemo(() =>
    normalized
      .filter((l) => correspondAuFiltre(l.affiche.etat, asideFilter))
      .sort((a, b) =>
        rangEtat(a.affiche.etat) - rangEtat(b.affiche.etat) ||
        Number(b.surCarte) - Number(a.surCarte) ||
        `${a.first_name ?? ""} ${a.last_name ?? ""}`.localeCompare(`${b.first_name ?? ""} ${b.last_name ?? ""}`, "fr"),
      ),
    [normalized, asideFilter],
  );

  const selected = normalized.find((l) => l.id === selectedId) ?? null;

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleSelectDeliverer = (l: LivreurCarte) => {
    setSelectedId(l.id);
    if (l.location) {
      mapRef.current?.panTo(l.location);
      mapRef.current?.setZoom(16);
    }
  };

  const sansPosition = normalized.length - visible.length;

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
              <h3 className="text-sm font-bold text-gray-900">Livreurs</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isLoading ? "Chargement…" : `${visible.length} sur la carte`}
                {!isLoading && sansPosition > 0 && (
                  <span className="text-amber-500"> · {sansPosition} sans position récente</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeOffline((v) => !v)}
              title={includeOffline ? "Masquer les positions anciennes" : "Afficher les positions anciennes"}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                includeOffline ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compteurs par statut */}
          <div className="flex gap-1.5 flex-wrap mt-2">
            {ORDRE_ETATS.map((etat) => {
              const c = normalized.filter((l) => l.affiche.etat === etat).length;
              if (c === 0) return null;
              const Icone = ICONE_ETAT[etat];
              return (
                <span
                  key={etat}
                  title={NOM_ETAT[etat]}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: COULEURS_ETAT[etat].fond, color: COULEURS_ETAT[etat].texte }}
                >
                  <Icone className="w-2.5 h-2.5" />{c}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sélecteur restaurant interne */}
        <div className="px-3 py-2 border-b border-gray-100 bg-white">
          <select
            value={localRestaurantId}
            onChange={(e) => setLocalRestaurantId(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none"
          >
            <option value="">Tous les restaurants</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Filtres disponibilité */}
        <div className="px-3 py-2 border-b border-gray-100 bg-white flex gap-1 flex-wrap">
          {FILTRES_CARTE.map((f) => {
            const isActive = asideFilter === f.cle;
            return (
              <button
                key={f.cle}
                type="button"
                onClick={() => setAsideFilter(f.cle)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? "bg-[#F17922] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.libelle}
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
              const couleurs = COULEURS_ETAT[l.affiche.etat];
              const initials = getInitials(l.first_name, l.last_name);
              const fullName = [l.first_name, l.last_name].filter(Boolean).join(" ") || "Livreur";
              const isActive = selectedId === l.id;
              const details  = detailsLivreur(l);

              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => l.surCarte && handleSelectDeliverer(l)}
                  disabled={!l.surCarte}
                  title={l.affiche.raison ?? undefined}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                    isActive
                      ? "bg-orange-50"
                      : l.surCarte
                      ? "hover:bg-gray-100 cursor-pointer"
                      : "opacity-75 cursor-default"
                  }`}
                >
                  {/* Avatar : photo si dispo, sinon initiales */}
                  <DelivererAvatar
                    image={l.image}
                    initials={initials}
                    color={couleurs.couleur}
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
                    {details && (
                      <p className="text-[10px] truncate mt-0.5" style={{ color: couleurs.texte }}>
                        {details}
                      </p>
                    )}
                  </div>

                  {/* Badge statut */}
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: couleurs.fond, color: couleurs.texte }}
                  >
                    {NOM_ETAT[l.affiche.etat]}
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
          {ORDRE_ETATS.filter((etat) => etat !== "INACTIF").map((etat) => (
            <span key={etat} className="inline-flex items-center gap-1 font-semibold"
              style={{ color: COULEURS_ETAT[etat].texte }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COULEURS_ETAT[etat].couleur }} />
              {NOM_ETAT[etat]}
            </span>
          ))}
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
            <AnimatedDelivererMarker
              key={l.id}
              position={l.location!}
              onClick={() => handleSelectDeliverer(l)}
              icon={buildMarkerIcon(l.affiche.etat, getInitials(l.first_name, l.last_name), selectedId === l.id)}
              durationMs={5000}
              zIndex={selectedId === l.id ? 10 : 1}
            />
          ))}
          {selected?.location && selected.surCarte && (
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

function LivreurInfoCard({ livreur }: { livreur: LivreurCarte }) {
  const etat      = livreur.affiche.etat;
  const couleurs  = COULEURS_ETAT[etat];
  const Icone     = ICONE_ETAT[etat];
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
          color={couleurs.couleur}
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
          style={{ backgroundColor: couleurs.fond, color: couleurs.texte }}
        >
          <Icone className="w-2.5 h-2.5" />{livreur.affiche.libelle}
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
        {livreur.appli && (
          <AppliInfoLigne appli={livreur.appli} />
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

/** Ligne « Appli » de la fiche : « Appli fermée · vue il y a 6 min », « En arrière-plan ». */
function AppliInfoLigne({ appli }: { appli: PresenceAppli }) {
  const Icone = ICONE_PRESENCE[appli.cas];
  return (
    <div className="flex items-center justify-between gap-3" title={appli.raison}>
      <dt className="text-gray-500">Appli</dt>
      <dd className="font-semibold flex items-center gap-1 text-right" style={{ color: COULEURS_PRESENCE[appli.cas].texte }}>
        <Icone className="w-3 h-3 shrink-0" />{libellePresence(appli)}
      </dd>
    </div>
  );
}
