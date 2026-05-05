import { api } from "@/services/api";
import { getHumanReadableError } from "@/utils/errorMessages";

import type { IDelivererScoringInfo } from "../types/deliverer-scoring.type";

const ENDPOINT = "/deliverers";

/**
 * Récupère la vue scoring + queue + refus + pause d'un livreur (admin only).
 *
 * Côté backend : agrège les champs scoring P4 / queue P5 / chainage P6 + recalcule
 * le rang relatif aux autres livreurs du même restaurant. Coûteux (~3 queries DB),
 * appelé typiquement à l'ouverture du drawer livreur ou en polling 15s.
 */
export async function getDelivererScoringInfo(
  delivererId: string,
): Promise<IDelivererScoringInfo> {
  try {
    return await api.get<IDelivererScoringInfo>(
      `${ENDPOINT}/${delivererId}/scoring-info`,
      true,
    );
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
}
