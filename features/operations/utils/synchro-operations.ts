/**
 * MISE À JOUR EN DIRECT DE L'ÉCRAN OPÉRATIONS (vérification du 23/10).
 *
 * Le serveur émet vers la salle du restaurant et celle du siège :
 *  - commandes (`order:*`) : création, statut, modification, suppression ;
 *  - courses : `course:assigned`, `course:statut:changed` (création, ajout,
 *    fusion, retenue, départ, retrait complémentaire, et depuis le serveur
 *    4b5f911 offre proposée, refusée, expirée ou close : raisons OFFRE_*),
 *    `course:completed`, `course:cancelled`, `course:delivery:statut:changed`.
 *
 * L'écran écoute tous ces événements et relit sa liste à chacun (banc du
 * 23/10 : « Proposée à Koffi » affiché moins d'une seconde après l'offre).
 * Filets en plus :
 *  - RECONNEXION : socket.io ne rejoue pas ce qui a été émis pendant une
 *    coupure (réseau, serveur qui coupe un socket muet). À chaque
 *    reconnexion, la liste est relue ;
 *  - RELECTURE toutes les 20 s, page visible seulement (comme la caisse),
 *    pour un serveur plus ancien qui n'annonce pas les offres.
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

/**
 * CACHE DU SERVEUR (banc du 23/10). Les lectures GET /orders/* passent par
 * un cache d'une seconde partagé par tout le siège (`UserScopedCacheInterceptor`,
 * `CacheModule` ttl 1000 ms). Une rafale d'événements (commande prête, course
 * créée, offre proposée, en 300 ms) faisait relire la liste à chacun : la
 * première lecture remplissait le cache, les suivantes recevaient cette réponse
 * d'avant la course, et « Proposée à Koffi » n'apparaissait qu'à la relecture
 * de filet, 20 s plus tard. Une relecture de confirmation part donc 1,2 s
 * après le dernier événement de la rafale, quand le cache a forcément expiré.
 */
export const CACHE_SERVEUR_MS = 1_000;
export const RELECTURE_CONFIRMATION_MS = 1_200;
/** Rafale continue : une confirmation au moins toutes les 3 s. */
export const ATTENTE_MAX_CONFIRMATION_MS = 3_000;

/** Minuterie remplaçable (tests). */
export interface Minuterie {
  planifier(rappel: () => void, ms: number): unknown;
  annuler(id: unknown): void;
  maintenant(): number;
}

const minuterieNavigateur: Minuterie = {
  planifier: (rappel, ms) => setTimeout(rappel, ms),
  annuler: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  maintenant: () => Date.now(),
};

/**
 * Relecture de confirmation : `signaler()` à chaque événement, `recharger`
 * part `RELECTURE_CONFIRMATION_MS` après le dernier (une seule pour la
 * rafale), au plus tard `ATTENTE_MAX_CONFIRMATION_MS` après le premier ; un
 * événement arrivé moins de 1,2 s avant une confirmation forcée en appelle
 * une autre.
 */
export function relectureDeConfirmation(recharger: () => void, minuterie: Minuterie = minuterieNavigateur) {
  let id: unknown = null;
  let premier = 0;
  let dernier = 0;
  const declencher = () => {
    id = null;
    recharger();
    const t = minuterie.maintenant();
    if (t - dernier < RELECTURE_CONFIRMATION_MS) {
      premier = t;
      id = minuterie.planifier(declencher, dernier + RELECTURE_CONFIRMATION_MS - t);
    }
  };
  return {
    signaler() {
      const t = minuterie.maintenant();
      dernier = t;
      if (id === null) premier = t;
      else minuterie.annuler(id);
      const echeance = Math.min(t + RELECTURE_CONFIRMATION_MS, premier + ATTENTE_MAX_CONFIRMATION_MS);
      id = minuterie.planifier(declencher, Math.max(0, echeance - t));
    },
    arreter() {
      if (id !== null) minuterie.annuler(id);
      id = null;
    },
  };
}

/** Ce que l'abonnement utilise du socket. */
export interface SocketEcoute {
  on(evenement: string, ecouteur: (...args: never[]) => void): unknown;
  off(evenement: string, ecouteur: (...args: never[]) => void): unknown;
}

/**
 * Pose les écouteurs de l'écran sur le socket. Rend la fonction qui les
 * retire (et seulement eux : les écouteurs du store du socket restent).
 * Chaque événement relit la liste tout de suite, puis une relecture de
 * confirmation suit la rafale (cache du serveur, voir plus haut).
 */
export function abonnerOperations<P>(
  socket: SocketEcoute,
  rappels: {
    /** Relit la liste (et les caches liés). */
    recharger: () => void;
    /** `course:statut:changed` : avis puis relecture. */
    surStatutCourse: (payload?: P) => void;
  },
  minuterie: Minuterie = minuterieNavigateur,
): () => void {
  const confirmation = relectureDeConfirmation(() => rappels.recharger(), minuterie);
  const recharger = () => {
    rappels.recharger();
    confirmation.signaler();
  };
  const surStatutCourse = (payload?: P) => {
    rappels.surStatutCourse(payload);
    confirmation.signaler();
  };
  const relecture = [...EVENEMENTS_COMMANDE, ...EVENEMENTS_COURSE, EVENEMENT_RECONNEXION];
  relecture.forEach((evenement) => socket.on(evenement, recharger));
  socket.on(EVENEMENT_STATUT_COURSE, surStatutCourse);
  return () => {
    relecture.forEach((evenement) => socket.off(evenement, recharger));
    socket.off(EVENEMENT_STATUT_COURSE, surStatutCourse);
    confirmation.arreter();
  };
}
