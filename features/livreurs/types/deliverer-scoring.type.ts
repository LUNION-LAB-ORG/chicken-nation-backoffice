/**
 * Types — Vue scoring + queue + refus + pause d'un livreur.
 *
 * Miroir TypeScript du payload renvoyé par les endpoints :
 *   - GET /deliverers/me/scoring-info       (mobile self)
 *   - GET /deliverers/:id/scoring-info      (admin / backoffice)
 *
 * Les valeurs `null` signalent qu'un calcul n'a pas pu se faire (livreur pas
 * opérationnel, hors-resto, etc.) — le composant doit gérer ces cas gracieusement.
 */

import type { CourseStatut } from "./deliverer-live.type";

export interface IDelivererScoringInfo {
  delivererId: string;
  restaurantId: string | null;
  isOperational: boolean;

  isInActiveCourse: boolean;
  activeCourse: {
    id: string;
    reference: string;
    statut: CourseStatut;
  } | null;

  lastAvailableAt: string | null;

  pauses: {
    pauseUntil: string | null;
    autoPauseUntil: string | null;
    isPaused: boolean;
    isAutoPaused: boolean;
  };

  refusals: {
    /** Fenêtre glissante en minutes (paramètre admin). */
    windowMinutes: number;
    /** Seuil de refus avant auto-pause. */
    threshold: number;
    /** Nombre de refus dans la fenêtre courante. */
    countInWindow: number;
    /** Timestamps ISO des refus dans la fenêtre. */
    timestamps: string[];
    /** Combien de refus avant déclenchement auto-pause. */
    remainingBeforeAutoPause: number;
  };

  queuePenalty: {
    /** Combien de positions de recul appliquées. */
    positions: number;
    /** Jusqu'à quand la pénalité s'applique. */
    until: string | null;
    /** True si actuellement pénalisé. */
    active: boolean;
  };

  ranking: {
    /** Position absolue dans la liste triée par score (1 = meilleur). */
    position: number | null;
    /** Nombre total de candidats actuels pour ce restaurant. */
    totalCandidates: number;
    /** Rang FIFO pur (1 = entré en queue en premier). */
    rankInQueue: number | null;
  } | null;

  scoring: {
    currentScore: number;
    distanceMeters: number | null;
    components: {
      queue: number;
      distance: number;
      chain: number;
      vehicle: number;
      penalty: number;
    };
    weights: {
      queue: number;
      distance: number;
      chain: number;
      vehicle: number;
    };
  } | null;

  reasons: string[];
}
