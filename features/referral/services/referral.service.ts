import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import {
  Ambassador,
  AmbassadorDetail,
  MarkPaidPayload,
  ReferralConfig,
  ReferralGlobalStats,
  ReferralPayout,
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

/** Parse une réponse d'erreur JSON en message lisible. */
const throwHttp = async (res: Response): Promise<never> => {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || `Erreur ${res.status}`);
};

/** Stats globales de parrainage. */
export const getReferralStats = async (): Promise<ReferralGlobalStats> => {
  try {
    const res = await fetch(`${BASE_URL}/stats`, { method: "GET", headers: headers() });
    if (!res.ok) return throwHttp(res);
    return (await res.json()) as ReferralGlobalStats;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Configuration courante du parrainage (inclut les réglages monétaires). */
export const getReferralConfig = async (): Promise<ReferralConfig> => {
  try {
    const res = await fetch(`${BASE_URL}/config`, { method: "GET", headers: headers() });
    if (!res.ok) return throwHttp(res);
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
    if (!res.ok) return throwHttp(res);
    return (await res.json()) as ReferralConfig;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/* -------------------------------------------------------------------------- */
/* Ambassadeurs & versements                                                  */
/* -------------------------------------------------------------------------- */

export interface AmbassadorsListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AmbassadorsListResult {
  items: Ambassador[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Normalise une réponse paginée : tolère les deux formes backoffice
 * (`{ items }` ou `{ data }`) sans caster le type (cf. pièges pagination).
 */
const normalizeList = <T>(
  raw: unknown,
  page: number,
  limit: number
): { items: T[]; total: number; page: number; totalPages: number } => {
  const r = (raw ?? {}) as Record<string, unknown>;
  const items = (Array.isArray(r.items)
    ? r.items
    : Array.isArray(r.data)
    ? r.data
    : Array.isArray(raw)
    ? raw
    : []) as T[];
  const total = typeof r.total === "number" ? r.total : items.length;
  const totalPages =
    typeof r.totalPages === "number"
      ? r.totalPages
      : Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const resolvedPage = typeof r.page === "number" ? r.page : page;
  return { items, total, page: resolvedPage, totalPages };
};

/** Liste paginée des ambassadeurs (parrains + soldes agrégés). */
export const getAmbassadors = async (
  params: AmbassadorsListParams = {}
): Promise<AmbassadorsListResult> => {
  const { page = 1, limit = 10, search } = params;
  try {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    if (search) qs.set("search", search.trim());
    const res = await fetch(`${BASE_URL}/ambassadors?${qs.toString()}`, {
      method: "GET",
      headers: headers(),
    });
    if (!res.ok) return throwHttp(res);
    return normalizeList<Ambassador>(await res.json(), page, limit);
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Détail d'un ambassadeur : soldes, gains détaillés, historique versements. */
export const getAmbassadorDetail = async (
  ambassadorId: string
): Promise<AmbassadorDetail> => {
  try {
    const res = await fetch(`${BASE_URL}/ambassadors/${ambassadorId}`, {
      method: "GET",
      headers: headers(),
    });
    if (!res.ok) return throwHttp(res);
    return (await res.json()) as AmbassadorDetail;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/**
 * Bascule les gains éligibles (PENDING au-dessus du seuil) en PAYABLE, prêts
 * à être versés hors-système.
 */
export const markAmbassadorPayable = async (
  ambassadorId: string
): Promise<AmbassadorDetail> => {
  try {
    const res = await fetch(`${BASE_URL}/ambassadors/${ambassadorId}/mark-payable`, {
      method: "POST",
      headers: headers(),
    });
    if (!res.ok) return throwHttp(res);
    return (await res.json()) as AmbassadorDetail;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/**
 * Marque un versement effectué (V1 = marquage manuel). Le serveur solde les
 * gains PAYABLE à hauteur du montant et journalise le versement.
 */
export const markAmbassadorPaid = async (
  ambassadorId: string,
  data: MarkPaidPayload
): Promise<ReferralPayout> => {
  try {
    const res = await fetch(`${BASE_URL}/ambassadors/${ambassadorId}/pay`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) return throwHttp(res);
    return (await res.json()) as ReferralPayout;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
