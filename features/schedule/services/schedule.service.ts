import { api } from "@/services/api";
import { getHumanReadableError } from "@/utils/errorMessages";

import type {
  IGeneratePlanPayload,
  ISchedulePlan,
  ISchedulePlanDetail,
  ISchedulePlanStats,
  SchedulePlanStatus,
} from "../types/schedule.types";

const ENDPOINT = "/schedule";

const safeCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    throw new Error(getHumanReadableError(error));
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
