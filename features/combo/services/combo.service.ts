import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import {
  ComboDrawResult,
  ComboGame,
  ComboParticipation,
  ComboWinner,
  CreateComboGameDto,
  UpdateComboGameDto,
} from "../types/combo.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + "/fidelity/combo";

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

// --- Jeux Combo (CRUD) ---

export const getComboGames = async () => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/games");
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ComboGame[];
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const getComboGame = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/games/${id}`);
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ComboGame;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const createComboGame = async (data: CreateComboGameDto) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "/games");
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ComboGame;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const updateComboGame = async (
  id: string,
  data: UpdateComboGameDto
) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/games/${id}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ComboGame;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const deleteComboGame = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/games/${id}`);
    const response = await fetch(url, { method: "DELETE", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    // DELETE peut renvoyer 204 (pas de corps) ou le jeu désactivé
    const text = await response.text();
    return text ? (JSON.parse(text) as ComboGame) : null;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Suivi ---

export const getComboParticipations = async (gameId: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      `/games/${gameId}/participations`
    );
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ComboParticipation[];
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const getComboWinners = async (gameId: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      `/games/${gameId}/winners`
    );
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ComboWinner[];
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Déclenche le tirage au sort de N gagnants parmi les bonnes réponses. */
export const drawComboWinners = async (gameId: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      `/games/${gameId}/draw`
    );
    const response = await fetch(url, { method: "POST", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ComboDrawResult;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
