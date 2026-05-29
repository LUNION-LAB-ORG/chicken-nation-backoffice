import { api } from "@/services/api";
import { getHumanReadableError } from "@/utils/errorMessages";

import type { ILatLngLiteral, IRouteResult } from "../types/maps.type";

const ENDPOINT = "/maps/directions";

/** Forme brute renvoyée par le backend (`maps.service.ts` → `IDirectionsResult`). */
interface IRawDirections {
  coordinates: Array<{ latitude: number; longitude: number }>;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
}

export interface IGetRouteParams {
  origin: ILatLngLiteral;
  destination: ILatLngLiteral;
  /** Arrêts intermédiaires optionnels (livraisons multi-stops). */
  waypoints?: ILatLngLiteral[];
}

/**
 * Récupère un itinéraire ROUTIER (proxy Google Directions, cache 10 min côté
 * backend) entre `origin` et `destination`, en passant par d'éventuels
 * `waypoints`.
 *
 * Convertit les coords `{ latitude, longitude }` du backend en `{ lat, lng }`
 * (format `@react-google-maps/api`) une seule fois ici — les consommateurs
 * (PolylineF) n'ont jamais à reconvertir.
 *
 * Remplace les anciennes polylines géodésiques en ligne droite : le tracé suit
 * désormais la route réelle, comme sur les apps mobiles.
 */
export async function getRoute(params: IGetRouteParams): Promise<IRouteResult> {
  try {
    const searchParams = new URLSearchParams({
      originLat: String(params.origin.lat),
      originLng: String(params.origin.lng),
      destLat: String(params.destination.lat),
      destLng: String(params.destination.lng),
    });

    if (params.waypoints && params.waypoints.length > 0) {
      // Le backend attend un JSON `[{ latitude, longitude }, ...]` en query string.
      searchParams.append(
        "waypoints",
        JSON.stringify(
          params.waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng })),
        ),
      );
    }

    const raw = await api.get<IRawDirections>(`${ENDPOINT}?${searchParams.toString()}`);

    return {
      path: raw.coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude })),
      distanceMeters: raw.totalDistanceMeters,
      durationSeconds: raw.totalDurationSeconds,
    };
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
}
