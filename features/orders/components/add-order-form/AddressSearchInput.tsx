import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Navigation } from "lucide-react";
import { OrderAddress } from "../../types/order.types";

interface AddressSearchInputProps {
  value: OrderAddress | null;
  onChange: (address: OrderAddress | null) => void;
  placeholder?: string;
}
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const AddressSearchInput: React.FC<AddressSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const mapRef = useRef<any>(null);

  // Charger Google Maps API
  useEffect(() => {
    if (window.google || !apiKey) {
      if (window.google) {
        initializeServices();
        setGoogleLoaded(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      initializeServices();
      setGoogleLoaded(true);
    };

    script.onerror = () => {
      console.error("Erreur lors du chargement de Google Maps");
    };

    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com"]`
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [apiKey]);

  // Initialiser les services Google
  const initializeServices = () => {
    if (!window.google) return;

    // Créer un élément de carte invisible pour PlacesService
    if (!mapRef.current) {
      const mapDiv = document.createElement("div");
      mapDiv.style.display = "none";
      document.body.appendChild(mapDiv);

      const map = new window.google.maps.Map(mapDiv, {
        center: { lat: 5.3599517, lng: -4.0082563 },
        zoom: 14,
      });

      mapRef.current = map;
    }

    autocompleteService.current =
      new window.google.maps.places.AutocompleteService();
    placesService.current = new window.google.maps.places.PlacesService(
      mapRef.current
    );
  };

  // Afficher l'adresse sélectionnée
  useEffect(() => {
    if (value) {
      setSearchQuery(value.title || value.address);
    }
  }, [value]);

  // Recherche avec autocomplétion
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowDropdown(true);

    if (!query.trim() || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    const request = {
      input: query,
      location: new window.google.maps.LatLng(5.3599517, -4.0082563), // Abidjan
      radius: 50000,
      componentRestrictions: { country: "ci" }, // Limiter à la Côte d'Ivoire
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (results: any, status: any) => {
        setIsLoading(false);

        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  // Sélectionner une adresse
  const selectPlace = (placeId: string) => {
    if (!placesService.current) return;

    const request = {
      placeId: placeId,
      fields: [
        "name",
        "formatted_address",
        "address_components",
        "geometry",
        "place_id",
      ],
    };

    placesService.current.getDetails(request, (place: any, status: any) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        // Extraire les informations
        const addressComponents = place.address_components || [];
        let street = "";
        let city = "";

        addressComponents.forEach((component: any) => {
          if (component.types.includes("route")) {
            street = component.long_name;
          }
          if (
            component.types.includes("locality") ||
            component.types.includes("administrative_area_level_1")
          ) {
            city = component.long_name;
          }
        });

        const addressData: OrderAddress = {
          title: place.name,
          address: place.formatted_address,
          street: street || "",
          city: city || "Abidjan",
          longitude: place.geometry.location.lng(),
          latitude: place.geometry.location.lat(),
          note: "",
        };

        onChange(addressData);
        setSearchQuery(place.name);
        setShowDropdown(false);
        setPredictions([]);
      }
    });
  };

  // Obtenir la position actuelle
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Geocoding inversé
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat, lng };

        geocoder.geocode({ location: latlng }, (results: any, status: any) => {
          setIsLoading(false);

          if (status === "OK" && results[0]) {
            const place = results[0];
            const addressComponents = place.address_components || [];
            let street = "";
            let city = "";

            addressComponents.forEach((component: any) => {
              if (component.types.includes("route")) {
                street = component.long_name;
              }
              if (
                component.types.includes("locality") ||
                component.types.includes("administrative_area_level_1")
              ) {
                city = component.long_name;
              }
            });

            const addressData: OrderAddress = {
              title: "Ma position actuelle",
              address: place.formatted_address,
              street: street || "",
              city: city || "Abidjan",
              longitude: lng,
              latitude: lat,
              note: "",
            };

            onChange(addressData);
            setSearchQuery("Ma position actuelle");
          }
        });
      },
      (error) => {
        setIsLoading(false);
        alert("Impossible d'obtenir votre position");
      }
    );
  };

  // Effacer la recherche
  const clearSearch = () => {
    setSearchQuery("");
    setPredictions([]);
    onChange(null);
    setShowDropdown(false);
  };

  if (!googleLoaded) {
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
            className="flex-1 py-1 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
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

      {/* Dropdown des résultats */}
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
                onClick={() => selectPlace(prediction.place_id)}
                className="w-full px-4 py-3 flex items-start hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="w-5 h-5 text-[#F17922] mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#595959] text-sm truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Informations de l'adresse sélectionnée */}
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
