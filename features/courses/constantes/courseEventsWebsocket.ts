/**
 * Events WebSocket reçus par le backoffice pour le module courses.
 * Tous invalident le cache `['courses']` côté admin.
 *
 * Émis par le backend via `CourseWebSocketService.emitToBackoffice()`.
 */
export const courseEventsWebsocket = [
  'course:assigned',
  'course:statut:changed',
  'course:delivery:statut:changed',
  'course:completed',
  'course:cancelled',
  'course:refresh',
] as const;
