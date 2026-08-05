import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import {
  CreateScratchLotDto,
  ScratchDrawsQuery,
  ScratchDrawsResponse,
  ScratchEnvelopeResponse,
  ScratchLot,
  ScratchSimulateQuery,
  ScratchSimulateResponse,
  UpdateScratchLotDto,
} from "../types/scratch.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + "/fidelity/scratch";

const prepareRequest = async <T>(
  baseUrl: string,
  endpoint: string,
  query?: T
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

  const url = `${baseUrl}${endpoint}${
    params.toString() ? `?${params.toString()}` : ""
  }`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return { url, headers };
};

// --- Lots ---

export const getScratchLots = async () => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/lots");
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ScratchLot[];
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const getScratchLot = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/lots/${id}`);
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ScratchLot;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const createScratchLot = async (data: CreateScratchLotDto) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/lots");
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ScratchLot;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const updateScratchLot = async (
  id: string,
  data: UpdateScratchLotDto
) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/lots/${id}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ScratchLot;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const deleteScratchLot = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/lots/${id}`);
    const response = await fetch(url, { method: "DELETE", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    // DELETE peut renvoyer 204 (pas de corps) ou le lot désactivé
    const text = await response.text();
    return text ? (JSON.parse(text) as ScratchLot) : null;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Simulateur ---

export const simulateScratch = async (query: ScratchSimulateQuery) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/simulate", query);
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ScratchSimulateResponse;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Moniteur d'enveloppe ---

export const getScratchEnvelope = async () => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/envelope");
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ScratchEnvelopeResponse;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};


export const getScratchDraws = async (query: ScratchDrawsQuery) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/draws", query);
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error("Chargement des tirages impossible");
    return (await response.json()) as ScratchDrawsResponse;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
