/**
 * Types partagés de la slice `maps` (backoffice).
 *
 * Centralise les contrats cartographiques réutilisés par les 3 surfaces live :
 * Carte Live livreurs, détail de course et carte dépliable du drawer commande.
 */

/** Coordonnée au format Google Maps JS (`{ lat, lng }`). */
export interface ILatLngLiteral {
  lat: number;
  lng: number;
}

/**
 * Itinéraire routier normalisé pour Google Maps JS.
 *
 * Le backend `/maps/directions` renvoie des coords `{ latitude, longitude }` ;
 * la slice les convertit en `{ lat, lng }` (format attendu par `@react-google-maps/api`)
 * une seule fois, à la frontière du service.
 */
export interface IRouteResult {
  /** Tracé routier complet (polyline décodée), prêt pour `<PolylineF path>`. */
  path: ILatLngLiteral[];
  /** Distance totale en mètres. */
  distanceMeters: number;
  /** Durée totale estimée en secondes. */
  durationSeconds: number;
}

/**
 * Position GPS live d'un livreur, reçue en WebSocket sur le canal
 * `deliverer:location:live` (émis par le backend à chaque ping GPS).
 *
 * Aligné champ pour champ sur le payload `emitLocationLive` côté backend.
 */
export interface IDelivererLivePosition {
  delivererId: string;
  lat: number;
  lng: number;
  /** Cap 0-360° (null si non fourni). */
  heading: number | null;
  /** Vitesse km/h validée (null si aberrante / absente). */
  speedKmh: number | null;
  /** Timestamp ISO de la remontée. */
  ts: string;
}
