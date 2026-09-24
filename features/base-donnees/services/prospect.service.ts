import { getHumanReadableError } from "@/utils/errorMessages";
import { getAuthToken } from "@/utils/authUtils";
import { CheckPhoneResult, CreateProspectPayload, Prospect, ProspectSettings, ScanResult } from "../types/prospect.types";

/**
 * Capture des clients Glovo/Yango (caisse, barre mobile, page Commandes) et
 * réglages du scan. Le suivi de ces clients (appels, coupons, ventes) vit
 * dans le CRM.
 */

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

// Réglages du moteur de scan (la remise et les messages sont dans les Réglages du CRM)
export const getProspectSettings = async () => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/settings");
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return (await response.json()) as ProspectSettings;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const updateProspectSettings = async (
  payload: Partial<ProspectSettings>,
) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/settings");
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as ProspectSettings;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

// Scan d'une capture de commande (OCR/IA) → champs préremplis
export const scanProspectOrder = async (file: File) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const form = new FormData();
  form.append("image", file);
  // Pas de Content-Type → le navigateur ajoute le boundary multipart automatiquement
  const response = await fetch(`${BASE_URL}/scan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as ScanResult;
};
