import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import {
  ComboDrawResult,
  ComboGame,
  ComboGift,
  ComboItemType,
  ComboParticipation,
  ComboStatus,
  ComboWinner,
  CreateComboGameDto,
  UpdateComboGameDto,
} from "../types/combo.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + "/fidelity/combo";

// ── Mapping front ↔ back ─────────────────────────────────────────────────────
// Le backend expose { clues, solution:[{type,id}], prize:{reward_type,payload} }
// et un statut ComboGameStatus (SCHEDULED|OPEN|CLOSED|SETTLED). Le front manipule
// { hints, solution_items, gift } + ComboStatus. On traduit dans les deux sens
// (sans ce pont, la création renvoie 400 : champs requis manquants côté back).

type BackendComboGame = {
  id: string;
  title: string;
  description: string | null;
  clues?: string[];
  solution?: Array<{
    type: ComboItemType;
    id: string;
    name?: string;
    quantity?: number;
  }>;
  starts_at: string;
  ends_at: string;
  max_attempts: number;
  winners_count: number;
  prize?: { reward_type?: string; payload?: Record<string, unknown> };
  status?: "SCHEDULED" | "OPEN" | "CLOSED" | "SETTLED";
  attempts_count?: number;
  correct_count?: number;
  winners_count_actual?: number;
  created_at: string;
  updated_at: string;
};

const STATUS_FROM_BACK: Record<string, ComboStatus> = {
  SCHEDULED: "SCHEDULED",
  OPEN: "ACTIVE",
  CLOSED: "ENDED",
  SETTLED: "DRAWN",
};

const toBackendGift = (gift: ComboGift) => {
  const payload: Record<string, unknown> = {};
  if (gift.item_type === "SUPPLEMENT" && gift.supplement_id) {
    payload.supplement_id = gift.supplement_id;
  } else if (gift.dish_id) {
    payload.dish_id = gift.dish_id;
  }
  if (gift.label) payload.label = gift.label;
  if (gift.quantity && gift.quantity > 0) payload.quantity = gift.quantity;
  return { reward_type: "GIFT", payload };
};

const toBackendBody = (
  data: Partial<CreateComboGameDto>
): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.description !== undefined) body.description = data.description;
  if (data.hints !== undefined) body.clues = data.hints;
  if (data.solution_items !== undefined)
    body.solution = data.solution_items.map((it) => ({
      type: it.item_type,
      id: it.item_id,
    }));
  if (data.starts_at !== undefined) body.starts_at = data.starts_at;
  if (data.ends_at !== undefined) body.ends_at = data.ends_at;
  if (data.max_attempts !== undefined) body.max_attempts = data.max_attempts;
  if (data.winners_count !== undefined) body.winners_count = data.winners_count;
  if (data.gift !== undefined) body.prize = toBackendGift(data.gift);
  return body;
};

const fromBackend = (g: BackendComboGame): ComboGame => {
  const payload = (g.prize?.payload ?? {}) as Record<string, unknown>;
  const hasStats = g.attempts_count != null || g.winners_count_actual != null;
  return {
    id: g.id,
    title: g.title,
    description: g.description ?? null,
    hints: Array.isArray(g.clues) ? g.clues : [],
    solution_items: (Array.isArray(g.solution) ? g.solution : []).map((s) => ({
      item_type: s.type,
      item_id: s.id,
      name: s.name,
      quantity: s.quantity,
    })),
    starts_at: g.starts_at,
    ends_at: g.ends_at,
    max_attempts: g.max_attempts,
    winners_count: g.winners_count,
    gift: {
      item_type: payload.item_type as ComboItemType | undefined,
      dish_id: payload.dish_id as string | undefined,
      supplement_id: payload.supplement_id as string | undefined,
      label: payload.label as string | undefined,
      name: payload.name as string | undefined,
      price: typeof payload.price === "number" ? payload.price : undefined,
      image: (payload.image as string | undefined) ?? null,
      quantity:
        typeof payload.quantity === "number" ? payload.quantity : undefined,
    },
    active: g.status !== "CLOSED" && g.status !== "SETTLED",
    winners_drawn: g.status === "SETTLED",
    status: g.status ? STATUS_FROM_BACK[g.status] : undefined,
    stats: hasStats
      ? {
          participants_count: g.attempts_count ?? 0,
          correct_count: g.correct_count ?? 0,
          winners_count: g.winners_count_actual ?? 0,
        }
      : undefined,
    created_at: g.created_at,
    updated_at: g.updated_at,
  };
};

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
    const { url, headers } = await prepareRequest(BASE_URL, "");
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return ((await response.json()) as BackendComboGame[]).map(fromBackend);
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const getComboGame = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return fromBackend((await response.json()) as BackendComboGame);
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const createComboGame = async (data: CreateComboGameDto) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, "");
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(toBackendBody(data)),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return fromBackend((await response.json()) as BackendComboGame);
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const updateComboGame = async (
  id: string,
  data: UpdateComboGameDto
) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(toBackendBody(data)),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return fromBackend((await response.json()) as BackendComboGame);
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const deleteComboGame = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
    const response = await fetch(url, { method: "DELETE", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    // DELETE peut renvoyer 204 (pas de corps) ou le jeu désactivé
    const text = await response.text();
    return text ? fromBackend(JSON.parse(text) as BackendComboGame) : null;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Suivi ---

export const getComboParticipations = async (gameId: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      `/${gameId}/participations`
    );
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    // Le backend renvoie `{ attempts, winners }` : les participations = attempts.
    const data = (await response.json()) as { attempts?: ComboParticipation[] };
    return (data?.attempts ?? []) as ComboParticipation[];
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/**
 * Gagnants d'une partie. Le backend n'a PAS d'endpoint dédié : `/:id/participations`
 * renvoie `{ attempts, winners }` — on en extrait les gagnants.
 */
export const getComboWinners = async (gameId: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      `/${gameId}/participations`
    );
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const data = (await response.json()) as { winners?: ComboWinner[] };
    return (data?.winners ?? []) as ComboWinner[];
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Déclenche le tirage au sort de N gagnants parmi les bonnes réponses.
 *  Côté backend, l'opération s'appelle « settle » (règlement de la partie). */
export const drawComboWinners = async (gameId: string) => {
  try {
    const { url, headers } = await prepareRequest(
      BASE_URL,
      `/${gameId}/settle`
    );
    const response = await fetch(url, { method: "POST", headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as ComboDrawResult;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
