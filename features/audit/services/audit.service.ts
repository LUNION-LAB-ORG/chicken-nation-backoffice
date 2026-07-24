import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import type {
  AuditFilters,
  AuditLogsResponse,
  AuditQuery,
} from "../types/audit.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + "/audit-logs";

const headers = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const toParams = (query: AuditQuery): string => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, String(value));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
};

export const getAuditLogs = async (
  query: AuditQuery,
): Promise<AuditLogsResponse> => {
  try {
    const res = await fetch(`${BASE_URL}${toParams(query)}`, {
      headers: headers(),
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return (await res.json()) as AuditLogsResponse;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

export const getAuditFilters = async (): Promise<AuditFilters> => {
  try {
    const res = await fetch(`${BASE_URL}/filters`, { headers: headers() });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return (await res.json()) as AuditFilters;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
