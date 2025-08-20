"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { LoadScript } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

interface GoogleMapsContextType {
  isScriptLoaded: boolean;
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map | null) => void;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | null>(null);

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

 
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleScriptLoad = useCallback(() => {
    setIsScriptLoaded(true);
  }, []);

  //  Récupération sécurisée de la clé API côté client uniquement
  const googleMapsApiKey = isClient ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' : '';

  // Pendant l'hydratation ou si pas de clé API
  if (!isClient || !googleMapsApiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isScriptLoaded: false, map: null, setMap }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isScriptLoaded, map, setMap }}>
      <LoadScript
        googleMapsApiKey={googleMapsApiKey}
        libraries={libraries}
        onLoad={handleScriptLoad}
      >
        {children}
      </LoadScript>
    </GoogleMapsContext.Provider>
  );
}