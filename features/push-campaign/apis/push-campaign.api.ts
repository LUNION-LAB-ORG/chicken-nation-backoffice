import { api } from "@/services/api";
import type {
  PushCampaign,
  PushCampaignListResponse,
  CreateCampaignPayload,
  CampaignQueryParams,
} from "../types/push-campaign.types";

const BASE = "/push-campaigns";

function qs(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export async function listCampaigns(
  query: CampaignQueryParams = {}
): Promise<PushCampaignListResponse> {
  return api.get(`${BASE}${qs(query as Record<string, unknown>)}`);
}

export async function getCampaign(id: string): Promise<PushCampaign> {
  return api.get(`${BASE}/${id}`);
}

export async function createCampaign(
  payload: CreateCampaignPayload
): Promise<PushCampaign> {
  return api.post(`${BASE}`, payload);
}

export async function cancelCampaign(id: string): Promise<PushCampaign> {
  return api.delete(`${BASE}/${id}`);
}
