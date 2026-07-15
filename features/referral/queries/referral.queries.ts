import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AmbassadorsListParams,
  getAmbassadorDetail,
  getAmbassadors,
  getReferralConfig,
  getReferralStats,
  markAmbassadorPaid,
  markAmbassadorPayable,
  updateReferralConfig,
} from "../services/referral.service";
import { MarkPaidPayload } from "../types/referral.types";

export const referralKeys = {
  all: ["referral"] as const,
  stats: () => [...referralKeys.all, "stats"] as const,
  config: () => [...referralKeys.all, "config"] as const,
  ambassadors: (params: AmbassadorsListParams) =>
    [...referralKeys.all, "ambassadors", params] as const,
  ambassador: (id: string) => [...referralKeys.all, "ambassador", id] as const,
};

/** Stats globales de parrainage. */
export const useReferralStatsQuery = () =>
  useQuery({
    queryKey: referralKeys.stats(),
    queryFn: getReferralStats,
    staleTime: 5 * 60 * 1000,
  });

/** Configuration courante (réglages monétaires inclus). */
export const useReferralConfigQuery = () =>
  useQuery({
    queryKey: referralKeys.config(),
    queryFn: getReferralConfig,
    staleTime: 5 * 60 * 1000,
  });

/** Enregistrement de la configuration + invalidation. */
export const useUpdateReferralConfigMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateReferralConfig,
    onSuccess: () => {
      toast.success("Configuration du parrainage enregistrée");
      qc.invalidateQueries({ queryKey: referralKeys.config() });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/** Liste paginée des ambassadeurs. */
export const useAmbassadorsQuery = (params: AmbassadorsListParams) =>
  useQuery({
    queryKey: referralKeys.ambassadors(params),
    queryFn: () => getAmbassadors(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

/** Détail d'un ambassadeur (gains + versements). */
export const useAmbassadorDetailQuery = (id: string | null) =>
  useQuery({
    queryKey: referralKeys.ambassador(id ?? ""),
    queryFn: () => getAmbassadorDetail(id as string),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

/** Bascule les gains éligibles en PAYABLE. */
export const useMarkPayableMutation = (ambassadorId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAmbassadorPayable(ambassadorId),
    onSuccess: () => {
      toast.success("Gains basculés en payable");
      qc.invalidateQueries({ queryKey: referralKeys.ambassador(ambassadorId) });
      qc.invalidateQueries({ queryKey: [...referralKeys.all, "ambassadors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/** Marque un versement effectué (marquage manuel). */
export const useMarkPaidMutation = (ambassadorId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkPaidPayload) => markAmbassadorPaid(ambassadorId, data),
    onSuccess: () => {
      toast.success("Versement enregistré");
      qc.invalidateQueries({ queryKey: referralKeys.ambassador(ambassadorId) });
      qc.invalidateQueries({ queryKey: [...referralKeys.all, "ambassadors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
