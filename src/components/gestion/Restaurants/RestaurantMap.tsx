"use client";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { apiRequest } from "@/services/api";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface RestaurantMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number, address: string) => void;
  className?: string;
  isViewOnly?: boolean;
}

const containerStyle = {
  width: "100%",
  height: "170px",
  borderRadius: "12px",
};

const defaultCenter = { lat: 5.359952, lng: -4.008256 };

// ─── Types backend proxy ──────────────────────────────────────────────────────

interface BackendAutocomplete {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface BackendReverseGeocode {
  formattedAddress: string;
  components: Array<{ long_name: string; short_name: string; types: string[] }>;
}

interface BackendPlaceDetails {
  placeId: string;
  formattedAddress: string;
  name: string;
  latitude: number;
  longitude: number;
  addressComponents: Array<{ long_name: string; short_name: string; types: string[] }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function RestaurantMap({
  initialLat,
  initialLng,
  onLocationChange,
  className = "",
  isViewOnly = false,
}: RestaurantMapProps) {
  const { isScriptLoaded, map, setMap } = useGoogleMaps();

  const [markerPos, setMarkerPos] = useState<google.maps.LatLng | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isMapReady, setIsMapReady] = useState(false);

  // Recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<BackendAutocomplete[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const sessionTokenRef = useRef<string>(newSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Init coordonnées initiales ──────────────────────────────────────────

  useEffect(() => {
    if (!isScriptLoaded || !isMapReady || !initialLat || !initialLng) return;

    const pos = new google.maps.LatLng(initialLat, initialLng);
    setMarkerPos(pos);
    map?.panTo(pos);
    map?.setZoom(15);

    // Géocodage inverse via backend (cache 24h)
    apiRequest<BackendReverseGeocode>(
      `/maps/geocode/reverse?lat=${initialLat}&lng=${initialLng}`,
    )
      .then((data) => {
        setAddress(data.formattedAddress);
        if (!isViewOnly) onLocationChange(initialLat, initialLng, data.formattedAddress);
      })
      .catch(() => {
        // Fallback silencieux — on ne bloque pas le rendu
      });
  }, [initialLat, initialLng, isScriptLoaded, isMapReady, map, isViewOnly, onLocationChange]);

  // ── Drag du marker ──────────────────────────────────────────────────────

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (isViewOnly || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Géocodage inverse via backend
      apiRequest<BackendReverseGeocode>(
        `/maps/geocode/reverse?lat=${lat}&lng=${lng}`,
      )
        .then((data) => {
          setAddress(data.formattedAddress);
          onLocationChange(lat, lng, data.formattedAddress);
        })
        .catch(() => {
          onLocationChange(lat, lng, "");
        });
    },
    [isViewOnly, onLocationChange],
  );

  // ── Recherche autocomplete ──────────────────────────────────────────────

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const qs = new URLSearchParams({
          input: value,
          components: "country:ci",
          language: "fr",
          sessionToken: sessionTokenRef.current,
        }).toString();
        const results = await apiRequest<BackendAutocomplete[]>(
          `/maps/places/autocomplete?${qs}`,
        );
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // ── Sélection d'un lieu ─────────────────────────────────────────────────

  const handleSelectPlace = useCallback(
    async (item: BackendAutocomplete) => {
      setSearchQuery(item.description);
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(true);

      try {
        const qs = new URLSearchParams({
          sessionToken: sessionTokenRef.current,
        }).toString();
        const details = await apiRequest<BackendPlaceDetails>(
          `/maps/places/details/${item.placeId}?${qs}`,
        );

        const pos = new google.maps.LatLng(details.latitude, details.longitude);
        setMarkerPos(pos);
        map?.panTo(pos);
        map?.setZoom(15);

        setAddress(details.formattedAddress);
        if (!isViewOnly) {
          onLocationChange(details.latitude, details.longitude, details.formattedAddress);
        }
      } catch {
        // Échec silencieux
      } finally {
        setIsSearching(false);
        // Nouveau session token pour la prochaine recherche
        sessionTokenRef.current = newSessionToken();
      }
    },
    [map, isViewOnly, onLocationChange],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleMapLoad = useCallback(
    (m: google.maps.Map) => {
      setMap(m);
      setIsMapReady(true);
    },
    [setMap],
  );

  // ── Rendu ────────────────────────────────────────────────────────────────

  if (!isScriptLoaded) {
    return (
      <div className={`${className} bg-gray-100 rounded-xl flex items-center justify-center`}>
        <p className="text-gray-500">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Barre de recherche custom (proxy backend) */}
        {!isViewOnly && (
          <div className="absolute top-4 left-4 z-10 w-[calc(100%-2rem)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Rechercher une adresse..."
                className="w-full pl-10 pr-8 h-[42px] rounded-xl bg-white border dark:text-gray-700 border-[#D8D8D8] px-4 text-[13px] placeholder-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-[#F17922]"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#F17922] border-t-transparent rounded-full animate-spin" />
              )}
              {!isSearching && searchQuery && (
                <button
                  type="button"
                  onMouseDown={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-52 overflow-y-auto">
                {suggestions.map((item) => (
                  <button
                    type="button"
                    key={item.placeId}
                    onMouseDown={() => handleSelectPlace(item)}
                    className="w-full px-4 py-2.5 flex flex-col items-start hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-semibold text-[#595959] text-[13px] truncate w-full">
                      {item.mainText}
                    </span>
                    {item.secondaryText && (
                      <span className="text-xs text-gray-500 truncate w-full mt-0.5">
                        {item.secondaryText}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Carte Google Maps — rendu visuel, ne peut pas être proxifié */}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={markerPos ?? defaultCenter}
          zoom={markerPos ? 15 : 12}
          onLoad={handleMapLoad}
          options={{
            styles: [
              { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          {markerPos && (
            <Marker
              position={markerPos}
              draggable={!isViewOnly}
              onDragEnd={handleMarkerDragEnd}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </div>

      {!isViewOnly && address && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-medium">Adresse sélectionnée :</p>
          <p>{address}</p>
        </div>
      )}
    </div>
  );
}
