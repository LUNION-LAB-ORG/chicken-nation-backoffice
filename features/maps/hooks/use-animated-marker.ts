"use client";

import { useCallback, useEffect, useRef } from "react";

import type { ILatLngLiteral } from "../types/maps.type";

/**
 * Fait GLISSER un `google.maps.Marker` d'une position GPS à la suivante, au lieu
 * de le téléporter — équivalent web de `AnimatedDriverMarker` (mobile).
 *
 * On reçoit une nouvelle position toutes les ~4-8 s (socket). Entre deux pings,
 * une boucle `requestAnimationFrame` interpole les frames intermédiaires et
 * appelle `marker.setPosition()` IMPÉRATIVEMENT — donc **zéro re-render React**
 * par frame (le pendant du `useNativeDriver` natif). C'est ce qui rend
 * l'animation fluide même avec plusieurs dizaines de markers sur la Carte Live.
 *
 * Le premier point (ou un saut > seuil, ex. réapparition après perte GPS) est
 * appliqué d'un coup pour éviter un glissement géant à travers la carte.
 *
 * @returns un `onLoad` à passer au `<MarkerF onLoad={...} />`.
 */
export function useAnimatedMarker(
  target: ILatLngLiteral | null,
  durationMs = 4000,
): (marker: google.maps.Marker) => void {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const fromRef = useRef<ILatLngLiteral | null>(null);
  const rafRef = useRef<number | null>(null);

  const onLoad = useCallback(
    (marker: google.maps.Marker) => {
      markerRef.current = marker;
      if (target) {
        marker.setPosition(target);
        fromRef.current = target;
      }
    },
    // `target` volontairement hors deps : on ne veut pas recréer le callback à
    // chaque ping. Le seed initial suffit ; l'effet ci-dessous gère les MAJ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !target) return;

    const from = fromRef.current;

    // Premier fix ou saut anormalement grand (~> 500 m) → snap direct.
    const SNAP_THRESHOLD_DEG = 0.005; // ~550 m en lat
    if (
      !from ||
      Math.abs(target.lat - from.lat) > SNAP_THRESHOLD_DEG ||
      Math.abs(target.lng - from.lng) > SNAP_THRESHOLD_DEG
    ) {
      marker.setPosition(target);
      fromRef.current = target;
      return;
    }

    // Pas de mouvement → rien à animer.
    if (target.lat === from.lat && target.lng === from.lng) return;

    const start = performance.now();
    const startFrom = from;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const lat = startFrom.lat + (target.lat - startFrom.lat) * t;
      const lng = startFrom.lng + (target.lng - startFrom.lng) * t;
      marker.setPosition({ lat, lng });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
        rafRef.current = null;
      }
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target?.lat, target?.lng, durationMs]);

  return onLoad;
}
