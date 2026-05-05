import { api } from "@/services/api";
import { getHumanReadableError } from "@/utils/errorMessages";

import type { IDelivererLive } from "../types/deliverer-live.type";

const ENDPOINT = "/deliverers/live-locations";

export interface IGetLiveLocationsParams {
  /** Filtre sur un restaurant (utile pour la vue ops d'un seul établissement). */
  restaurantId?: string;
  /** Inclure les livreurs sans GPS récent (default `false`). */
  includeOffline?: boolean;
}

/**
 * Récupère la liste des livreurs actifs avec leur position GPS temps réel,
 * statut de disponibilité et course active éventuelle.
 *
 * Le backend exclut par défaut les livreurs dont le GPS date de plus de
 * `deliverer.gps_expiration_minutes` — activer `includeOffline=true` pour
 * les voir dans la carte (avec marker grisé).
 */
export async function getDelivererLiveLocations(
  params: IGetLiveLocationsParams = {},
): Promise<IDelivererLive[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params.restaurantId) searchParams.append("restaurantId", params.restaurantId);
    if (params.includeOffline) searchParams.append("includeOffline", "true");
    const qs = searchParams.toString();
    const url = qs ? `${ENDPOINT}?${qs}` : ENDPOINT;
    return await api.get<IDelivererLive[]>(url);
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
}
