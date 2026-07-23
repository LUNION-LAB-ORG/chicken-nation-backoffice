import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import {
  CampaignRecipients,
  CreateRewardCampaignPayload,
  RewardCampaign,
} from "../types/reward-campaign.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + "/fidelity/reward-campaigns";

const headers = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/** Crée/envoie une campagne de cadeau (immédiate ou programmée). */
export const createRewardCampaign = async (
  data: CreateRewardCampaignPayload
): Promise<RewardCampaign> => {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erreur ${res.status}`);
    }
    return (await res.json()) as RewardCampaign;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Liste les campagnes + suivi (ciblés / grattés). */
export const listRewardCampaigns = async (): Promise<RewardCampaign[]> => {
  try {
    const res = await fetch(BASE_URL, { method: "GET", headers: headers() });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return (await res.json()) as RewardCampaign[];
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Annule une campagne encore programmée. */
export const cancelRewardCampaign = async (
  id: string
): Promise<{ cancelled: boolean }> => {
  try {
    const res = await fetch(`${BASE_URL}/${id}/cancel`, {
      method: "PATCH",
      headers: headers(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erreur ${res.status}`);
    }
    return (await res.json()) as { cancelled: boolean };
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/**
 * Destinataires d'une campagne avec leur statut individuel (reçu / gratté /
 * utilisé) — ce que les compteurs agrégés ne disaient pas.
 */
export const getCampaignRecipients = async (
  id: string
): Promise<CampaignRecipients> => {
  try {
    const res = await fetch(`${BASE_URL}/${id}/recipients`, { headers: headers() });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return (await res.json()) as CampaignRecipients;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
