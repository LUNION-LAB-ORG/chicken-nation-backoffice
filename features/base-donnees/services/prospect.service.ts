import { getHumanReadableError } from "@/utils/errorMessages";
import { getAuthToken } from "@/utils/authUtils";
import { PaginatedResponse } from "../../../types";
import {
  CallQueueResponse,
  CallResult,
  CheckPhoneResult,
  CouponRow,
  CreateProspectPayload,
  Prospect,
  ProspectDetail,
  ProspectQuery,
  ProspectStats,
  SalesResponse,
  SendCouponResult,
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

// ============================================================
// PHASE 2 — Call Center
// ============================================================

export const getProspectDetail = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as ProspectDetail;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const getCallQueue = async (restaurantId?: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      "/call-queue",
      restaurantId ? { restaurantId } : undefined,
    );
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as CallQueueResponse;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const markProspectCall = async (
  id: string,
  payload: { result: CallResult; note?: string },
) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}/call`);
    const response = await fetch(url, {
      method: "PATCH",
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

export const sendProspectCoupon = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}/coupon`);
    const response = await fetch(url, { method: "POST", headers, body: "{}" });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SendCouponResult;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

// ============================================================
// PHASE 3 — Analytics
// ============================================================

export const getProspectStats = async (restaurantId?: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      "/stats",
      restaurantId ? { restaurantId } : undefined,
    );
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return (await response.json()) as ProspectStats;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const getProspectCoupons = async (restaurantId?: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      "/coupons",
      restaurantId ? { restaurantId } : undefined,
    );
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return (await response.json()) as CouponRow[];
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const getProspectSales = async (restaurantId?: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      "/sales",
      restaurantId ? { restaurantId } : undefined,
    );
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return (await response.json()) as SalesResponse;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
