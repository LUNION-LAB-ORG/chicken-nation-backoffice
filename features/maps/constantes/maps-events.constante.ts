/**
 * Canal WebSocket des positions GPS live des livreurs, émis par le backend
 * (`DeliverersWebSocketService.emitLocationLive`) vers `backoffice_all` et
 * `restaurant_{id}` à chaque ping GPS.
 *
 * Doit rester strictement identique à `DelivererChannels.DELIVERER_LOCATION_LIVE`
 * côté backend.
 */
export const DELIVERER_LOCATION_LIVE_EVENT = "deliverer:location:live";
