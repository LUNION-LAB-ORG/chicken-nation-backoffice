"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Navigation } from "lucide-react";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { apiRequest } from "@/services/api";
import { OrderAddress } from "../../types/order.types";

interface BackendReverseGeocode {
  formattedAddress: string;
  components: Array<{ long_name: string; short_name: string; types: string[] }>;
}

interface AddressSearchInputProps {
  value: OrderAddress | null;
  onChange: (address: OrderAddress | null) => void;
  placeholder?: string;
}

/**
 * Champ de recherche d'adresse (Places Autocomplete + Geocoding inverse).
 *
 * Utilise `useGoogleMaps()` pour attendre que le script Google Maps soit
 * chargé par `GoogleMapsContext` — plus de double injection `<script>`.
 *
 * La clé API (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) reste dans `GoogleMapsContext`
 * et est restreinte au domaine backoffice dans Google Cloud Console.
 */
const AddressSearchInput: React.FC<AddressSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse",
}) => {
  const { isScriptLoaded } = useGoogleMaps();

  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Initialiser les services dès que le script est prêt
  useEffect(() => {
    if (!isScriptLoaded || typeof window.google === "undefined") return;

    // Carte invisible nécessaire pour PlacesService
    if (!mapRef.current) {
      const mapDiv = document.createElement("div");
      mapDiv.style.display = "none";
      document.body.appendChild(mapDiv);
      mapRef.current = new window.google.maps.Map(mapDiv, {
        center: { lat: 5.3599517, lng: -4.0082563 },
        zoom: 14,
      });
    }

    autocompleteService.current = new window.google.maps.places.AutocompleteService();
    placesService.current = new window.google.maps.places.PlacesService(mapRef.current);
    // Nouveau session token — groupera les appels Autocomplete + Details
    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
  }, [isScriptLoaded]);

  // Sync valeur entrante
  useEffect(() => {
    if (value) setSearchQuery(value.title || value.address);
  }, [value]);

  // ── Autocomplétion ──────────────────────────────────────────────────────

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setShowDropdown(true);

    if (!query.trim() || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        location: new window.google.maps.LatLng(5.3599517, -4.0082563),
        radius: 50000,
        componentRestrictions: { country: "ci" },
        sessionToken: sessionTokenRef.current ?? undefined,
      },
      (results, status) => {
        setIsLoading(false);
        setPredictions(
          status === window.google.maps.places.PlacesServiceStatus.OK && results
            ? results
            : [],
        );
      },
    );
  }, []);

  // ── Sélection d'un lieu ─────────────────────────────────────────────────

  const selectPlace = useCallback((placeId: string) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId,
        fields: ["name", "formatted_address", "address_components", "geometry", "place_id"],
        // Même session token → toute la session facturée comme 1 seul appel Details
        sessionToken: sessionTokenRef.current ?? undefined,
      },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return;

        const components = place.address_components ?? [];
        let street = "";
        let city = "";

        components.forEach((c) => {
          if (c.types.includes("route")) street = c.long_name;
          if (c.types.includes("locality") || c.types.includes("administrative_area_level_1")) {
            city = c.long_name;
          }
        });

        onChange({
          title: place.name ?? "",
          address: place.formatted_address ?? "",
          street: street || "",
          city: city || "Abidjan",
          longitude: place.geometry!.location!.lng(),
          latitude: place.geometry!.location!.lat(),
          note: "",
        });

        setSearchQuery(place.name ?? "");
        setShowDropdown(false);
        setPredictions([]);

        // Réinitialiser le session token pour la prochaine session de recherche
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      },
    );
  }, [onChange]);

  // ── Géolocalisation ─────────────────────────────────────────────────────

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Géocodage inverse via backend proxy (cache 24h, clé côté serveur)
          const data = await apiRequest<BackendReverseGeocode>(
            `/maps/geocode/reverse?lat=${lat}&lng=${lng}`,
          );

          const street = data.components.find((c) => c.types.includes("route"))?.long_name ?? "";
          const city =
            data.components.find(
              (c) => c.types.includes("locality") || c.types.includes("administrative_area_level_1"),
            )?.long_name ?? "Abidjan";

          onChange({
            title: "Ma position actuelle",
            address: data.formattedAddress,
            street,
            city,
            longitude: lng,
            latitude: lat,
            note: "",
          });
          setSearchQuery("Ma position actuelle");
        } catch {
          // Fallback sans adresse
          onChange({
            title: "Ma position actuelle",
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            street: "",
            city: "Abidjan",
            longitude: lng,
            latitude: lat,
            note: "",
          });
          setSearchQuery("Ma position actuelle");
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setIsLoading(false);
        alert("Impossible d'obtenir votre position");
      },
    );
  }, [onChange]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setPredictions([]);
    onChange(null);
    setShowDropdown(false);
  }, [onChange]);

  // ── Rendu ────────────────────────────────────────────────────────────────

  if (!isScriptLoaded) {
    return (
      <motion.div
        className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl"
        whileHover={{ scale: 1.01 }}
      >
        <label className="text-xs font-semibold text-[#595959] mb-1 block">
          Entrez l'adresse complète de livraison
        </label>
        <div className="py-1 text-[13px] text-gray-400">
          Chargement de la recherche d'adresse...
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <label className="text-xs font-semibold text-[#595959] mb-1 block">
          Entrez l'adresse complète de livraison
        </label>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="flex-1 py-1 text-[13px] focus:outline-none text-[#595959] font-semibold"
            placeholder={placeholder}
          />

          {isLoading && (
            <div className="w-4 h-4 border-2 border-[#F17922] border-t-transparent rounded-full animate-spin" />
          )}

          {searchQuery && !isLoading && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          <button
            type="button"
            onClick={getCurrentLocation}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Utiliser ma position"
          >
            <Navigation className="w-4 h-4 text-[#F17922]" />
          </button>
        </div>
      </motion.div>

      {/* Dropdown suggestions */}
      <AnimatePresence>
        {showDropdown && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto"
          >
            {predictions.map((prediction) => (
              <button
                type="button"
                key={prediction.place_id}
                onMouseDown={() => selectPlace(prediction.place_id)}
                className="w-full px-4 py-3 flex items-start hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="w-5 h-5 text-[#F17922] mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#595959] text-sm truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  {prediction.structured_formatting.secondary_text && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adresse sélectionnée */}
      {value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 p-3 bg-orange-50 rounded-xl border border-orange-100"
        >
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#F17922] mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-[#595959]">{value.title}</p>
              <p className="text-gray-600 mt-1">{value.address}</p>
              <p className="text-gray-500 mt-1">
                📍 {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AddressSearchInput;
