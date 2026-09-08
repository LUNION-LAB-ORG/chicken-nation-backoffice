"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ("places" | "visualization")[] = ["places", "visualization"];

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

/**
 * Chargement de Google Maps, une seule fois pour toute l'application.
 *
 * ⚠️ DEUX DEFAUTS corrigés ici, qui produisaient tous deux le message
 * « Impossible de charger Google Maps correctement sur cette page ».
 *
 * 1. `LoadScript` RETIRE le script quand il est démonté, puis le réinjecte au
 *    remontage. Google refuse alors la seconde injection et affiche cette
 *    bannière sur la carte. C'est la raison pour laquelle la bibliothèque
 *    fournit `useJsApiLoader` : il charge le script une fois, sans jamais le
 *    décharger, et un second appel ne fait rien.
 *
 * 2. L'ancienne version changeait la FORME de l'arbre : au premier rendu les
 *    enfants étaient rendus seuls, puis, une fois `isClient` passé à vrai, ils
 *    se retrouvaient à l'intérieur de `<LoadScript>`. React voit un élément
 *    différent à cette position et REMONTE tout le sous-arbre, c'est-à-dire
 *    l'application entière. Les enfants sont désormais toujours au même
 *    endroit, quel que soit l'état du chargement.
 *
 * La carte doit toujours attendre `isScriptLoaded` avant de s'afficher : le
 * contexte le rend, c'est le contrat inchangé.
 */
export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    // Identifiant STABLE : c'est lui qui garantit qu'un second montage ne
    // réinjecte pas le script.
    id: 'chicken-nation-google-maps',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries,
    version: 'quarterly',
  });

  return (
    <GoogleMapsContext.Provider value={{ isScriptLoaded: isLoaded, map, setMap }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
