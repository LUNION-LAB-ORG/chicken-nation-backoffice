import { api } from "@/services/api";

import type {
  IApercuPlanning,
  IGeneratePlanPayload,
  IPlanningLivreur,
  ISchedulePlan,
  ISchedulePlanDetail,
  ISchedulePlanStats,
  SchedulePlanStatus,
} from "../types/schedule.types";
import type { ErreurPlanning } from "../utils/erreurs-planning";

export type { ErreurPlanning } from "../utils/erreurs-planning";
export { estPlanningEfface, estRouteAbsente } from "../utils/erreurs-planning";

const ENDPOINT = "/schedule";

/**
 * Le refus du serveur est écrit pour l'écran (« Repos interdit ce jour-là : jour de forte activité. »,
 * « Ce plan n'est pas celui de votre restaurant. ») : il est montré tel
 * quel. `getHumanReadableError` le remplaçait par des phrases des promotions.
 * Le statut reste joint : un 404 dit qu'une route nouvelle manque au serveur.
 */
const safeCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const e = error as { message?: string; messageServeur?: string; status?: number };
    // `api` garde déjà le texte du serveur pour 400, 403 et 409 ; pour un 404
    // (« Plan introuvable. »), il est à côté, dans `messageServeur`.
    // Les 5xx gardent le texte par défaut de `api`.
    const texte =
      (e?.status === 404 ? e?.messageServeur?.trim() : undefined) ||
      e?.message?.trim() ||
      "Une erreur est survenue. Veuillez réessayer.";
    throw Object.assign(new Error(texte), { status: e?.status }) as ErreurPlanning;
  }
};

interface IListPlansParams {
  restaurantId?: string;
  status?: SchedulePlanStatus;
}

const buildQs = (params: IListPlansParams): string => {
  const sp = new URLSearchParams();
  if (params.restaurantId) sp.append("restaurantId", params.restaurantId);
  if (params.status) sp.append("status", params.status);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
};

// ============================================================
// PLANS
// ============================================================

export const listSchedulePlans = (params: IListPlansParams = {}) =>
  safeCall(() => api.get<ISchedulePlan[]>(`${ENDPOINT}/plans${buildQs(params)}`, true));

export const getSchedulePlanDetail = (planId: string) =>
  safeCall(() => api.get<ISchedulePlanDetail>(`${ENDPOINT}/plans/${planId}`, true));

export const generateSchedulePlan = (payload: IGeneratePlanPayload) =>
  safeCall(() => api.post<ISchedulePlan>(`${ENDPOINT}/plans/generate`, payload, true));

export const sendSchedulePlan = (planId: string) =>
  safeCall(() => api.patch<ISchedulePlan>(`${ENDPOINT}/plans/${planId}/send`, {}, true));

export const confirmSchedulePlan = (planId: string) =>
  safeCall(() => api.patch<ISchedulePlan>(`${ENDPOINT}/plans/${planId}/confirm`, {}, true));

export const archiveSchedulePlan = (planId: string) =>
  safeCall(() => api.patch<ISchedulePlan>(`${ENDPOINT}/plans/${planId}/archive`, {}, true));

export const deleteSchedulePlan = (planId: string) =>
  safeCall(() => api.delete<{ id: string; deleted: boolean }>(`${ENDPOINT}/plans/${planId}`, true));

export const setDelivererDay = (
  planId: string,
  delivererId: string,
  payload: { date: string; mode: "REST" | "WORK" },
) =>
  safeCall(() =>
    api.patch<ISchedulePlan>(
      `${ENDPOINT}/plans/${planId}/deliverers/${delivererId}/day`,
      payload,
      true,
    ),
  );

export const regenerateSchedulePlan = (
  planId: string,
  payload: { periodStart: string; periodEnd?: string },
) =>
  safeCall(() =>
    api.post<ISchedulePlan>(`${ENDPOINT}/plans/${planId}/regenerate`, payload, true),
  );

export const getSchedulePlanStats = (planId: string) =>
  safeCall(() => api.get<ISchedulePlanStats>(`${ENDPOINT}/plans/${planId}/stats`, true));

/** Ajout incrémental d'un livreur (rattaché après coup) à un plan existant. */
export const addDelivererToPlan = (planId: string, delivererId: string) =>
  safeCall(() =>
    api.post<{ added: number }>(
      `${ENDPOINT}/plans/${planId}/deliverers/${delivererId}`,
      {},
      true,
    ),
  );

// ============================================================
// SERVEUR DU 24/10 (404 sur un serveur plus ancien)
// ============================================================

/** Planning en cours, suivant et livreurs prévus aujourd'hui, par restaurant. */
export const getApercuPlannings = () =>
  safeCall(() => api.get<IApercuPlanning[]>(`${ENDPOINT}/apercu`, true));

/** Livreurs actifs du restaurant du planning qui n'y sont pas encore. */
export const getLivreursAjoutables = (planId: string) =>
  safeCall(() =>
    api.get<IPlanningLivreur[]>(`${ENDPOINT}/plans/${planId}/livreurs-ajoutables`, true),
  );

/** Retire un livreur du planning : ses jours de travail et ses repos posés par le planning. */
export const removeDelivererFromPlan = (planId: string, delivererId: string) =>
  safeCall(() =>
    api.delete<{ removed: number }>(
      `${ENDPOINT}/plans/${planId}/deliverers/${delivererId}`,
      true,
    ),
  );
