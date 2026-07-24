import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAuditFilters, getAuditLogs } from "../services/audit.service";
import type { AuditQuery } from "../types/audit.types";

/** Journal paginé + filtré. `keepPreviousData` évite le clignotement en pagination. */
export const useAuditLogsQuery = (query: AuditQuery) =>
  useQuery({
    queryKey: ["audit-logs", query],
    queryFn: () => getAuditLogs(query),
    placeholderData: keepPreviousData,
  });

/** Valeurs de filtres (modules + auteurs). Peu volatile → cache long. */
export const useAuditFiltersQuery = () =>
  useQuery({
    queryKey: ["audit-filters"],
    queryFn: getAuditFilters,
    staleTime: 5 * 60 * 1000,
  });
