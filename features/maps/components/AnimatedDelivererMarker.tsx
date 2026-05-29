"use client";

import React, { useRef } from "react";
import { MarkerF } from "@react-google-maps/api";

import { useAnimatedMarker } from "../hooks/use-animated-marker";
import type { ILatLngLiteral } from "../types/maps.type";

interface Props {
  /** Position GPS cible courante (mise à jour à chaque ping socket). */
  position: ILatLngLiteral;
  /** Icône du marker (ex. `delivererCourseMarkerIcon(heading)`). */
  icon?: google.maps.Icon | google.maps.Symbol;
  /** Durée d'interpolation entre deux pings (ms). À caler sur la cadence GPS. */
  durationMs?: number;
  zIndex?: number;
  onClick?: () => void;
}

/**
 * Marker livreur qui GLISSE entre deux positions GPS (équivalent web de
 * `AnimatedDriverMarker`). Le mouvement est piloté impérativement par
 * `useAnimatedMarker` (setPosition par frame) → aucun re-render React par frame.
 *
 * La `position` passée à `MarkerF` est figée au montage (`initialRef`) pour que
 * le rendu déclaratif ne réinitialise jamais la position et ne combatte pas
 * l'animation. Les pings suivants alimentent le hook, pas le prop `position`.
 * L'`icon`, lui, peut changer librement (rotation selon le cap).
 */
export function AnimatedDelivererMarker({
  position,
  icon,
  durationMs,
  zIndex,
  onClick,
}: Props) {
  const onLoad = useAnimatedMarker(position, durationMs);
  const initialRef = useRef(position);

  return (
    <MarkerF
      onLoad={onLoad}
      position={initialRef.current}
      icon={icon}
      zIndex={zIndex}
      onClick={onClick}
    />
  );
}
