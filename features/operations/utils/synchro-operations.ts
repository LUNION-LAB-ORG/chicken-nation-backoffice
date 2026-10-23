/**
 * MISE À JOUR EN DIRECT DE L'ÉCRAN OPÉRATIONS (vérification du 23/10).
 *
 * Le serveur émet vers la salle du restaurant et celle du siège :
 *  - commandes (`order:*`) : création, statut, modification, suppression ;
 *  - courses : `course:assigned`, `course:statut:changed` (création, ajout,
 *    fusion, retenue, départ, retrait complémentaire), `course:completed`,
 *    `course:cancelled` ; `course:delivery:statut:changed` au siège seulement.
 *
 * L'écran écoute tous ces événements et relit sa liste à chacun. Deux trous
 * restaient, comblés ici :
 *  - RECONNEXION : socket.io ne rejoue pas ce qui a été émis pendant une
 *    coupure (réseau, serveur qui coupe un socket muet). À chaque
 *    reconnexion, la liste est relue ;
 *  - OFFRES : une offre proposée, refusée ou expirée n'est envoyée qu'au
 *    livreur. « Recherche d'un livreur » ou « Proposée à Koffi, réponse avant
 *    12 h 36 » ne changeaient donc qu'au prochain événement d'une autre
 *    sorte. La liste est relue toutes les 20 s, page visible seulement
 *    (comme la caisse), en attendant un événement du serveur.
 *
 * Fichier pur : testé par `bun test`.
 */

/** Événements des commandes (OrderChannels, backend). */
export const EVENEMENTS_COMMANDE = [
  'order:created',
  'order:updated',
  'order:statusUpdated',
  'order:deleted',
  'order:refresh',
] as const;

/** Événements des courses qui ne demandent qu'une relecture (CourseChannels, backend). */
export const EVENEMENTS_COURSE = [
  'course:assigned',
  'course:delivery:statut:changed',
  'course:completed',
  'course:cancelled',
  'course:refresh',
] as const;

/** Changement d'une course : relecture ET avis (ajout, fusion) calculé avant. */
export const EVENEMENT_STATUT_COURSE = 'course:statut:changed';

/** Reconnexion du socket (événement de socket.io). */
export const EVENEMENT_RECONNEXION = 'connect';

/** Relecture de filet de la liste (offres proposées, refusées, expirées). */
export const RELECTURE_OPERATIONS_MS = 20_000;

/** Ce que l'abonnement utilise du socket. */
export interface SocketEcoute {
  on(evenement: string, ecouteur: (...args: never[]) => void): unknown;
  off(evenement: string, ecouteur: (...args: never[]) => void): unknown;
}

/**
 * Pose les écouteurs de l'écran sur le socket. Rend la fonction qui les
 * retire (et seulement eux : les écouteurs du store du socket restent).
 */
export function abonnerOperations<P>(
  socket: SocketEcoute,
  rappels: {
    /** Relit la liste (et les caches liés). */
    recharger: () => void;
    /** `course:statut:changed` : avis puis relecture. */
    surStatutCourse: (payload?: P) => void;
  },
): () => void {
  const recharger = () => rappels.recharger();
  const surStatutCourse = (payload?: P) => rappels.surStatutCourse(payload);
  const relecture = [...EVENEMENTS_COMMANDE, ...EVENEMENTS_COURSE, EVENEMENT_RECONNEXION];
  relecture.forEach((evenement) => socket.on(evenement, recharger));
  socket.on(EVENEMENT_STATUT_COURSE, surStatutCourse);
  return () => {
    relecture.forEach((evenement) => socket.off(evenement, recharger));
    socket.off(EVENEMENT_STATUT_COURSE, surStatutCourse);
  };
}
