import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import {
  ReferralConfig,
  ReferralGlobalStats,
  SetReferralConfigPayload,
} from "../types/referral.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + "/referral/admin";

const headers = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/** Stats globales de parrainage. */
export const getReferralStats = async (): Promise<ReferralGlobalStats> => {
  try {
    const res = await fetch(`${BASE_URL}/stats`, { method: "GET", headers: headers() });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return (await res.json()) as ReferralGlobalStats;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Configuration courante du parrainage. */
export const getReferralConfig = async (): Promise<ReferralConfig> => {
  try {
    const res = await fetch(`${BASE_URL}/config`, { method: "GET", headers: headers() });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return (await res.json()) as ReferralConfig;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Met à jour la configuration du parrainage. */
export const updateReferralConfig = async (
  data: SetReferralConfigPayload
): Promise<ReferralConfig> => {
  try {
    const res = await fetch(`${BASE_URL}/config`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erreur ${res.status}`);
    }
    return (await res.json()) as ReferralConfig;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
