"use client";

import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";
import { Search } from "lucide-react";
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

const defaultCenter = {
  lat: 5.359952, // Abidjan coordinates
  lng: -4.008256,
};

export default function RestaurantMap({
  initialLat,
  initialLng,
  onLocationChange,
  className = "",
  isViewOnly = false,
}: RestaurantMapProps) {
  const { isScriptLoaded, map, setMap } = useGoogleMaps();
  const [marker, setMarker] = useState<google.maps.LatLng | null>(null);
  const [searchBox, setSearchBox] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [address, setAddress] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map with initial coordinates if provided
  useEffect(() => {
    if (isScriptLoaded && initialLat && initialLng && isMapReady) {
      const position = { lat: initialLat, lng: initialLng };
      const newMarker = new google.maps.LatLng(position.lat, position.lng);
      setMarker(newMarker);

      // Center map on marker
      if (map) {
        map.panTo(newMarker);
        map.setZoom(15);
      }

      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: position }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          setAddress(results[0].formatted_address);
          if (!isViewOnly) {
            onLocationChange(
              position.lat,
              position.lng,
              results[0].formatted_address
            );
          }
        }
      });
    }
  }, [
    initialLat,
    initialLng,
    isScriptLoaded,
    isMapReady,
    map,
    isViewOnly,
    onLocationChange,
  ]);

  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      setIsMapReady(true);
    },
    [setMap]
  );

  const onMarkerLoad = useCallback(
    (marker: google.maps.Marker) => {
      if (!isViewOnly) {
        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();

            // Reverse geocode to get address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === "OK" && results?.[0]) {
                setAddress(results[0].formatted_address);
                onLocationChange(lat, lng, results[0].formatted_address);
              }
            });
          }
        });
      }
    },
    [onLocationChange, isViewOnly]
  );

  const onSearchBoxLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      setSearchBox(autocomplete);
    },
    []
  );

  const onPlaceChanged = useCallback(() => {
    if (searchBox) {
      const place = searchBox.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Update marker position
        const newPosition = new google.maps.LatLng(lat, lng);
        setMarker(newPosition);

        // Update map center
        map?.panTo(newPosition);
        map?.setZoom(15);

        // Update address and notify parent
        const formattedAddress = place.formatted_address || "";
        setAddress(formattedAddress);
        if (!isViewOnly) {
          onLocationChange(lat, lng, formattedAddress);
        }
      }
    }
  }, [searchBox, map, onLocationChange, isViewOnly]);

  if (!isScriptLoaded) {
    return (
      <div
        className={`${className} bg-gray-100 rounded-xl flex items-center justify-center`}
      >
        <p className="text-gray-500">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {!isViewOnly && (
          <div className="absolute top-4 left-4 z-10 w-[calc(100%-2rem)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Autocomplete
                onLoad={onSearchBoxLoad}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher une adresse..."
                  className="w-full pl-10 h-[42px] rounded-xl bg-white border dark:text-gray-700 border-[#D8D8D8] px-4 text-[13px] placeholder-gray-400 shadow-md"
                />
              </Autocomplete>
            </div>
          </div>
        )}

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={marker || defaultCenter}
          zoom={marker ? 15 : 12}
          onLoad={handleMapLoad}
          options={{
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          {marker && (
            <Marker
              position={marker}
              draggable={!isViewOnly}
              onLoad={onMarkerLoad}
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
