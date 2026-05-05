import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveSchedulePlan,
  confirmSchedulePlan,
  generateSchedulePlan,
  getSchedulePlanDetail,
  getSchedulePlanStats,
  listSchedulePlans,
  sendSchedulePlan,
} from "../services/schedule.service";
import type {
  IGeneratePlanPayload,
  SchedulePlanStatus,
} from "../types/schedule.types";

const KEY = ["schedule"];

export const useSchedulePlansQuery = (params: {
  restaurantId?: string;
  status?: SchedulePlanStatus;
} = {}) =>
  useQuery({
    queryKey: [...KEY, "plans", params],
    queryFn: () => listSchedulePlans(params),
    staleTime: 30 * 1000,
  });

export const useSchedulePlanDetailQuery = (planId: string | null | undefined) =>
  useQuery({
    queryKey: [...KEY, "plan", planId],
    queryFn: () => getSchedulePlanDetail(planId as string),
    enabled: Boolean(planId),
    refetchInterval: 15 * 1000, // pour suivre les confirmations en live
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
  });

export const useSchedulePlanStatsQuery = (planId: string | null | undefined) =>
  useQuery({
    queryKey: [...KEY, "stats", planId],
    queryFn: () => getSchedulePlanStats(planId as string),
    enabled: Boolean(planId),
    refetchInterval: 15 * 1000,
    staleTime: 10 * 1000,
  });

// ============================================================
// MUTATIONS
// ============================================================

export const useGeneratePlanMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IGeneratePlanPayload) => generateSchedulePlan(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "plans"] }),
  });
};

export const useSendPlanMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => sendSchedulePlan(planId),
    onSuccess: (_, planId) => {
      qc.invalidateQueries({ queryKey: [...KEY, "plans"] });
      qc.invalidateQueries({ queryKey: [...KEY, "plan", planId] });
    },
  });
};

export const useConfirmPlanMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => confirmSchedulePlan(planId),
    onSuccess: (_, planId) => {
      qc.invalidateQueries({ queryKey: [...KEY, "plans"] });
      qc.invalidateQueries({ queryKey: [...KEY, "plan", planId] });
    },
  });
};

export const useArchivePlanMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => archiveSchedulePlan(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "plans"] }),
  });
};
