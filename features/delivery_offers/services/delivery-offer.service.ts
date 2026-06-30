import { getAuthToken } from "@/utils/authUtils";
import { PaginatedResponse } from "../../../types";
import {
  CreateDeliveryOfferDto,
  DeliveryOffer,
  DeliveryOfferQuery,
  DeliveryOfferStats,
  UpdateDeliveryOfferDto,
} from "../types/delivery-offer.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + "/delivery-offers";

const prepareRequest = async <T>(
  baseUrl: string,
  endpoint: string,
  query?: T,
) => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    });
  }

  const url = `${baseUrl}${endpoint}${params.toString() ? `?${params.toString()}` : ""}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  return { url, headers };
};

export const getDeliveryOffers = async (query?: DeliveryOfferQuery) => {
  const { url, headers } = await prepareRequest(BASE_URL, "", query);
  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  return (await response.json()) as PaginatedResponse<DeliveryOffer>;
};

export const getDeliveryOfferStats = async () => {
  const { url, headers } = await prepareRequest(BASE_URL, "/stats");
  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  return (await response.json()) as DeliveryOfferStats;
};

export const getDeliveryOffer = async (id: string) => {
  const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  return (await response.json()) as DeliveryOffer;
};

export const createDeliveryOffer = async (data: CreateDeliveryOfferDto) => {
  const { url, headers } = await prepareRequest(BASE_URL, "");
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Erreur HTTP ${response.status}`);
  }
  return (await response.json()) as DeliveryOffer;
};

export const updateDeliveryOffer = async (
  id: string,
  data: UpdateDeliveryOfferDto,
) => {
  const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Erreur HTTP ${response.status}`);
  }
  return (await response.json()) as DeliveryOffer;
};

export const deleteDeliveryOffer = async (id: string) => {
  const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
  const response = await fetch(url, { method: "DELETE", headers });
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  return (await response.json()) as DeliveryOffer;
};

export const toggleDeliveryOffer = async (id: string) => {
  const { url, headers } = await prepareRequest(BASE_URL, `/${id}/toggle`);
  const response = await fetch(url, { method: "POST", headers });
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  return (await response.json()) as DeliveryOffer;
};
