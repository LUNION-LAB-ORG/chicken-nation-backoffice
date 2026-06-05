import { getHumanReadableError } from "@/utils/errorMessages";
import { getAuthToken } from "@/utils/authUtils";
import { PaginatedResponse } from "../../../types";
import {
  CheckPhoneResult,
  CreateProspectPayload,
  Prospect,
  ProspectQuery,
} from "../types/prospect.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + "/prospects";

const prepareRequest = async <T>(
  baseUrl: string,
  endpoint: string,
  query?: T,
) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    });
  }

  const url = `${baseUrl}${endpoint}${params.toString() ? `?${params.toString()}` : ""}`;
  return {
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

export const getAllProspects = async (query?: ProspectQuery) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/", query);
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as PaginatedResponse<Prospect>;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const createProspect = async (payload: CreateProspectPayload) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/");
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as Prospect;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

// Détection de doublon avant saisie
export const checkProspectPhone = async (phone: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/check-phone", {
      phone,
    });
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as CheckPhoneResult;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
