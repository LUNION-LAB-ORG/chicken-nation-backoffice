import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { getAllLivreurs } from "../../livreurs/services/livreur.service";
import {
  addDelivererToPlan,
  archiveSchedulePlan,
  confirmSchedulePlan,
  deleteSchedulePlan,
  estRouteAbsente,
  generateSchedulePlan,
  getApercuPlannings,
  getLivreursAjoutables,
  getSchedulePlanDetail,
  getSchedulePlanStats,
  listSchedulePlans,
  regenerateSchedulePlan,
  removeDelivererFromPlan,
  sendSchedulePlan,
  setDelivererDay,
} from "../services/schedule.service";
import type {
  IGeneratePlanPayload,
  IPlanningLivreur,
  SchedulePlanStatus,
} from "../types/schedule.types";

const KEY = ["schedule"];

/** Le refus du serveur, tel quel, en message bref. */
const montrerRefus = (e: unknown) =>
  toast.error(e instanceof Error && e.message ? e.message : "Une erreur est survenue. Veuillez réessayer.");

/** Pas de nouvel essai quand la route manque (serveur ancien) : la réponse ne changera pas. */
const nouvelEssai = (n: number, e: unknown) => !estRouteAbsente(e) && n < 2;

export const useSchedulePlansQuery = (
  params: {
    restaurantId?: string;
    status?: SchedulePlanStatus;
  } = {},
  enabled = true,
) =>
  useQuery({
    queryKey: [...KEY, "plans", params],
    queryFn: () => listSchedulePlans(params),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
    enabled,
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

/** Tableau du siège « Plannings des restaurants » (`GET /schedule/apercu`). */
export const useApercuPlanningsQuery = (enabled = true) =>
  useQuery({
    queryKey: [...KEY, "apercu"],
    queryFn: getApercuPlannings,
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    retry: nouvelEssai,
  });

/**
 * Livreurs actifs du restaurant qui ne sont pas sur le planning
 * (`GET …/livreurs-ajoutables`). Serveur ancien (route absente) : la liste
 * des livreurs du restaurant, comme avant, moins ceux du planning.
 */
export const useLivreursAjoutablesQuery = (
  plan: { id: string; restaurantId: string; dejaSurLePlanning: string[] } | null,
) =>
  useQuery({
    queryKey: [...KEY, "ajoutables", plan?.id],
    enabled: Boolean(plan),
    staleTime: 0,
    queryFn: async (): Promise<IPlanningLivreur[]> => {
      try {
        return await getLivreursAjoutables(plan!.id);
      } catch (e) {
        if (!estRouteAbsente(e)) throw e;
        const page = await getAllLivreurs({ restaurant_id: plan!.restaurantId, status: "ACTIVE", limit: 100 });
        const sur = new Set(plan!.dejaSurLePlanning);
        return (page?.items ?? [])
          .filter((l) => !sur.has(l.id))
          .map((l) => ({ id: l.id, first_name: l.first_name, last_name: l.last_name, image: l.image ?? null }));
      }
    },
  });

// ============================================================
// MUTATIONS
// ============================================================

/** Après un geste : la liste, le détail, ses compteurs et l'aperçu du siège. */
const useRelire = () => {
  const qc = useQueryClient();
  return (planId?: string) => {
    qc.invalidateQueries({ queryKey: [...KEY, "plans"] });
    qc.invalidateQueries({ queryKey: [...KEY, "apercu"] });
    if (planId) {
      qc.invalidateQueries({ queryKey: [...KEY, "plan", planId] });
      qc.invalidateQueries({ queryKey: [...KEY, "stats", planId] });
      qc.invalidateQueries({ queryKey: [...KEY, "ajoutables", planId] });
    }
  };
};

export const useGeneratePlanMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (payload: IGeneratePlanPayload) => generateSchedulePlan(payload),
    onSuccess: () => relire(),
  });
};

export const useSendPlanMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (planId: string) => sendSchedulePlan(planId),
    onSuccess: (_, planId) => relire(planId),
    onError: montrerRefus,
  });
};

export const useConfirmPlanMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (planId: string) => confirmSchedulePlan(planId),
    onSuccess: (_, planId) => relire(planId),
    onError: montrerRefus,
  });
};

export const useArchivePlanMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (planId: string) => archiveSchedulePlan(planId),
    onSuccess: (_, planId) => relire(planId),
    onError: montrerRefus,
  });
};

export const useDeletePlanMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (planId: string) => deleteSchedulePlan(planId),
    onSuccess: () => relire(),
    onError: montrerRefus,
  });
};

export const useSetDelivererDayMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (vars: {
      planId: string;
      delivererId: string;
      date: string;
      mode: "REST" | "WORK";
    }) => setDelivererDay(vars.planId, vars.delivererId, { date: vars.date, mode: vars.mode }),
    onSuccess: (_, vars) => relire(vars.planId),
    onError: montrerRefus,
  });
};

export const useAddDelivererToPlanMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (vars: { planId: string; delivererId: string }) =>
      addDelivererToPlan(vars.planId, vars.delivererId),
    onSuccess: (_, vars) => relire(vars.planId),
    onError: montrerRefus,
  });
};

export const useRemoveDelivererFromPlanMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (vars: { planId: string; delivererId: string }) =>
      removeDelivererFromPlan(vars.planId, vars.delivererId),
    onSuccess: (_, vars) => relire(vars.planId),
    onError: montrerRefus,
  });
};

/** Le refus s'affiche dans la fenêtre « Modifier les dates », pas en message. */
export const useRegeneratePlanMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (vars: { planId: string; periodStart: string; periodEnd?: string }) =>
      regenerateSchedulePlan(vars.planId, {
        periodStart: vars.periodStart,
        periodEnd: vars.periodEnd,
      }),
    // L'ancien planning n'existe plus : ne pas relire son détail.
    onSuccess: () => relire(),
  });
};
