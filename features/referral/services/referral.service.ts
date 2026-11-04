import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import { filtersToQueryParams, StatsFilters } from "../../statistics/filters/statistics.filters";
import {
  Ambassador,
  AmbassadorDetail,
  EtatFilleul,
  EtatParrain,
  MarkPaidPayload,
  ReferralClientCandidat,
  ReferralConfig,
  ReferralEarningKind,
  ReferralEarningStatus,
  ReferralFilleulLigne,
  ReferralGainLigne,
  ReferralGlobalStats,
  ReferralPayout,
  ReferralTableau,
  SetReferralConfigPayload,
  TriParrain,
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

/** Filtres communs des listes. */
interface ListeParams {
  page?: number;
  limit?: number;
  search?: string;
  /** Période : rien = tout le programme. */
  filtres?: StatsFilters;
}

export interface AmbassadorsListParams extends ListeParams {
  etat?: EtatParrain;
  tri?: TriParrain;
}

export interface AmbassadorsListResult {
  items: Ambassador[];
  total: number;
  page: number;
  totalPages: number;
  compteurs?: Record<EtatParrain | "tous", number>;
}

export interface FilleulsListParams extends ListeParams {
  etat?: EtatFilleul;
}

export interface FilleulsListResult {
  items: ReferralFilleulLigne[];
  total: number;
  page: number;
  totalPages: number;
  compteurs?: Record<EtatFilleul | "tous", number>;
}

export interface GainsListParams extends ListeParams {
  status?: ReferralEarningStatus;
  type?: ReferralEarningKind;
}

export interface GainsListResult {
  items: ReferralGainLigne[];
  total: number;
  page: number;
  totalPages: number;
  compteurs?: Record<ReferralEarningStatus | "tous", number>;
  /** Total des gains filtrés (FCFA). */
  montant?: number;
}

/** Paramètres d'URL : période et filtres renseignés. */
const lireParams = ({ filtres, ...reste }: ListeParams & Record<string, unknown>): string => {
  const qs = new URLSearchParams(filtersToQueryParams(filtres ?? {}));
  for (const [cle, valeur] of Object.entries(reste)) {
    if (valeur !== undefined && valeur !== null && valeur !== "") qs.set(cle, String(valeur));
  }
  return qs.toString();
};

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
  const { page = 1, limit = 10 } = params;
  try {
    const res = await fetch(`${BASE_URL}/ambassadors?${lireParams({ ...params, page, limit })}`, {
      method: "GET",
      headers: headers(),
    });
    if (!res.ok) return throwHttp(res);
    const brut = await res.json();
    return { ...normalizeList<Ambassador>(brut, page, limit), compteurs: brut?.compteurs };
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

/** Requête JSON vers l'administration du parrainage, erreurs lisibles. */
const envoyer = async <T>(chemin: string, method: string, body?: unknown): Promise<T> => {
  try {
    const res = await fetch(`${BASE_URL}${chemin}`, {
      method,
      headers: headers(),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) return throwHttp(res);
    return (await res.json()) as T;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

/** Chiffres du programme sur la période, soldes à ce jour, courbes. */
export const getReferralTableau = (filtres: StatsFilters): Promise<ReferralTableau> =>
  envoyer(`/tableau?${lireParams({ filtres })}`, "GET");

/** Tous les filleuls. */
export const getReferralFilleuls = ({
  page = 1,
  limit = 10,
  ...reste
}: FilleulsListParams): Promise<FilleulsListResult> =>
  envoyer(`/filleuls?${lireParams({ ...reste, page, limit })}`, "GET");

/** Tous les gains. */
export const getReferralGains = ({
  page = 1,
  limit = 10,
  ...reste
}: GainsListParams): Promise<GainsListResult> =>
  envoyer(`/earnings?${lireParams({ ...reste, page, limit })}`, "GET");

/** Passe en payable les gains en attente des parrains qui ont atteint le seuil. */
export const applyPayoutThreshold = (): Promise<{ promoted_referrers: number; updated: number }> =>
  envoyer("/earnings/apply-threshold", "POST");

/** Clients à faire parrain ou filleul (2 caractères au moins). */
export const searchReferralClients = (search: string): Promise<ReferralClientCandidat[]> =>
  envoyer(`/clients?search=${encodeURIComponent(search.trim())}`, "GET");

/** Fait d'un client un parrain : code choisi, sinon CN-PRENOM. */
export const createAmbassador = (data: {
  customer_id: string;
  code?: string;
}): Promise<AmbassadorDetail> => envoyer("/ambassadors", "POST", data);

/** Change le code d'un parrain. */
export const changeAmbassadorCode = (
  ambassadorId: string,
  code: string
): Promise<AmbassadorDetail> => envoyer(`/ambassadors/${ambassadorId}/code`, "PATCH", { code });

/** Rattache un filleul qui a oublié le code à l'inscription. */
export const addAmbassadorFilleul = (
  ambassadorId: string,
  customerId: string
): Promise<AmbassadorDetail> =>
  envoyer(`/ambassadors/${ambassadorId}/filleuls`, "POST", { customer_id: customerId });

/** Annule un parrainage : les gains non versés sont annulés. */
export const cancelReferral = (referralId: string): Promise<AmbassadorDetail> =>
  envoyer(`/referrals/${referralId}/annuler`, "POST");

/** Bascule tous les gains en attente du parrain en PAYABLE. */
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
 * Marque un versement effectué hors du système : le serveur solde tous les
 * gains PAYABLE. Le montant envoyé doit être ce solde.
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
