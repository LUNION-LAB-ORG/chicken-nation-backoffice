import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import * as campaignApi from "../apis/push-campaign.api";
import type {
  PushCampaignListResponse,
  PushCampaign,
  CreateCampaignPayload,
  CampaignQueryParams,
} from "../types/push-campaign.types";

const keys = {
  all: () => ["push-campaigns"] as const,
  list: (q?: CampaignQueryParams) => ["push-campaigns", "list", q] as const,
  detail: (id: string) => ["push-campaigns", "detail", id] as const,
};

export function useCampaignListQuery(query: CampaignQueryParams = {}) {
  return useQuery<PushCampaignListResponse>({
    queryKey: keys.list(query),
    queryFn: () => campaignApi.listCampaigns(query),
    staleTime: 30_000,
  });
}

export function useCampaignQuery(id: string) {
  return useQuery<PushCampaign>({
    queryKey: keys.detail(id),
    queryFn: () => campaignApi.getCampaign(id),
    enabled: !!id,
  });
}

export function useCreateCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) =>
      campaignApi.createCampaign(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all() });
      toast.success("Campagne créée et envoyée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création");
    },
  });
}

export function useCancelCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignApi.cancelCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all() });
      toast.success("Campagne annulée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'annulation");
    },
  });
}
