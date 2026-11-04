import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { StatsFilters } from "../../statistics/filters/statistics.filters";
import {
  AmbassadorsListParams,
  FilleulsListParams,
  GainsListParams,
  addAmbassadorFilleul,
  applyPayoutThreshold,
  cancelReferral,
  changeAmbassadorCode,
  createAmbassador,
  getAmbassadorDetail,
  getAmbassadors,
  getReferralConfig,
  getReferralFilleuls,
  getReferralGains,
  getReferralStats,
  getReferralTableau,
  markAmbassadorPaid,
  markAmbassadorPayable,
  searchReferralClients,
  updateReferralConfig,
} from "../services/referral.service";
import { AmbassadorDetail, MarkPaidPayload } from "../types/referral.types";

export const referralKeys = {
  all: ["referral"] as const,
  stats: () => [...referralKeys.all, "stats"] as const,
  config: () => [...referralKeys.all, "config"] as const,
  ambassadors: (params: AmbassadorsListParams) =>
    [...referralKeys.all, "ambassadors", params] as const,
  ambassador: (id: string) => [...referralKeys.all, "ambassador", id] as const,
  clients: (search: string) => [...referralKeys.all, "clients", search] as const,
  tableau: (filtres: StatsFilters) => [...referralKeys.all, "tableau", filtres] as const,
  filleuls: (params: FilleulsListParams) => [...referralKeys.all, "filleuls", params] as const,
  gains: (params: GainsListParams) => [...referralKeys.all, "gains", params] as const,
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

/** Chiffres du programme sur la période. */
export const useReferralTableauQuery = (filtres: StatsFilters) =>
  useQuery({
    queryKey: referralKeys.tableau(filtres),
    queryFn: () => getReferralTableau(filtres),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

/** Tous les filleuls. */
export const useReferralFilleulsQuery = (params: FilleulsListParams) =>
  useQuery({
    queryKey: referralKeys.filleuls(params),
    queryFn: () => getReferralFilleuls(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

/** Tous les gains. */
export const useReferralGainsQuery = (params: GainsListParams) =>
  useQuery({
    queryKey: referralKeys.gains(params),
    queryFn: () => getReferralGains(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

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
      qc.invalidateQueries({ queryKey: referralKeys.all });
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
      qc.invalidateQueries({ queryKey: referralKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/** Clients à faire parrain ou filleul. */
export const useReferralClientsQuery = (search: string) =>
  useQuery({
    queryKey: referralKeys.clients(search.trim()),
    queryFn: () => searchReferralClients(search),
    enabled: search.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

/** Fiche reçue après un geste : posée en cache, liste rafraîchie. */
const useGesteParrain = <V,>(
  geste: (v: V) => Promise<AmbassadorDetail>,
  message: string
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: geste,
    onSuccess: (fiche) => {
      toast.success(message);
      qc.setQueryData(referralKeys.ambassador(fiche.customer_id), fiche);
      qc.invalidateQueries({ queryKey: referralKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/** Passe en payable tous les parrains qui ont atteint le seuil. */
export const useApplyThresholdMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applyPayoutThreshold,
    onSuccess: ({ promoted_referrers }) => {
      toast.success(
        promoted_referrers > 1
          ? `${promoted_referrers} parrains passés en payable`
          : `${promoted_referrers} parrain passé en payable`
      );
      qc.invalidateQueries({ queryKey: referralKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/** Fait d'un client un parrain. */
export const useCreateAmbassadorMutation = () =>
  useGesteParrain(createAmbassador, "Parrain ajouté");

/** Change le code d'un parrain. */
export const useChangeAmbassadorCodeMutation = (ambassadorId: string) =>
  useGesteParrain((code: string) => changeAmbassadorCode(ambassadorId, code), "Code modifié");

/** Rattache un filleul. */
export const useAddFilleulMutation = (ambassadorId: string) =>
  useGesteParrain(
    (customerId: string) => addAmbassadorFilleul(ambassadorId, customerId),
    "Filleul rattaché"
  );

/** Annule un parrainage. */
export const useCancelReferralMutation = () =>
  useGesteParrain(cancelReferral, "Parrainage annulé");
