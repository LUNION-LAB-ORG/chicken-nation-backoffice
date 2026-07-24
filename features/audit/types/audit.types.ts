export type AuditView = "actions" | "logs";

/** Une entrée du journal d'audit (miroir du modèle backend `AuditLog`). */
export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  restaurant_id: string | null;
  action: string; // CREATE | UPDATE | DELETE | LOGIN | READ | OTHER
  module: string | null;
  entity_id: string | null;
  method: string;
  path: string;
  status_code: number | null;
  duration_ms: number | null;
  ip: string | null;
  user_agent: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  view?: AuditView;
  actor_id?: string;
  module?: string;
  action?: string;
  method?: string;
  errors_only?: boolean;
  search?: string;
  from?: string;
  to?: string;
}

export interface AuditFilters {
  modules: string[];
  actors: { id: string; name: string | null }[];
}
