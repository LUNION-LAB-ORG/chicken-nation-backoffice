import { api } from "@/services/api";
import type {
  PushCampaign,
  CreateCampaignPayload,
  CampaignQuery,
  PaginatedResponse,
  PushTemplate,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  TemplateQuery,
  PushSegment,
  SegmentPreviewPayload,
  CustomSegment,
  CreateSegmentPayload,
  UpdateSegmentPayload,
  ScheduledNotification,
  CreateScheduledPayload,
  UpdateScheduledPayload,
  PushUser,
  PushUserDetail,
  PushCampaignStats,
  PushCampaignChartData,
} from "@/types/push-campaign";

const BASE = "/push-campaigns";

// ── Helpers ──────────────────────────────────────────────────────────────────

function qs(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

// ── Campaigns ────────────────────────────────────────────────────────────────

export async function createCampaign(
  payload: CreateCampaignPayload
): Promise<PushCampaign> {
  return api.post<PushCampaign>(BASE, payload);
}

export async function listCampaigns(
  query: CampaignQuery = {}
): Promise<PaginatedResponse<PushCampaign>> {
  return api.get(`${BASE}${qs(query)}`);
}

export async function getCampaign(id: string): Promise<PushCampaign> {
  return api.get<PushCampaign>(`${BASE}/${id}`);
}

export async function cancelCampaign(
  id: string
): Promise<PushCampaign> {
  return api.delete<PushCampaign>(`${BASE}/${id}`);
}

// ── Stats ────────────────────────────────────────────────────────────────────

export async function getCampaignStats(): Promise<PushCampaignStats> {
  return api.get<PushCampaignStats>(`${BASE}/stats`);
}

export async function getCampaignChartData(days = 30): Promise<PushCampaignChartData> {
  return api.get<PushCampaignChartData>(`${BASE}/stats/chart?days=${days}`);
}

// ── Segments ─────────────────────────────────────────────────────────────────

export async function getSegments(): Promise<PushSegment[]> {
  return api.get<PushSegment[]>(`${BASE}/segments`);
}

export async function previewSegment(
  payload: SegmentPreviewPayload
): Promise<{ count: number }> {
  return api.post<{ count: number }>(`${BASE}/segments/preview`, payload);
}

export async function previewCustomFilters(
  filters: Record<string, unknown>
): Promise<{ count: number }> {
  return api.post<{ count: number }>(`${BASE}/segments/preview-filters`, { filters });
}

// ── Custom Segments ─────────────────────────────────────────────────────────

export async function createCustomSegment(
  payload: CreateSegmentPayload
): Promise<CustomSegment> {
  return api.post<CustomSegment>(`${BASE}/segments/custom`, payload);
}

export async function listCustomSegments(): Promise<CustomSegment[]> {
  return api.get<CustomSegment[]>(`${BASE}/segments/custom`);
}

export async function getCustomSegment(id: string): Promise<CustomSegment> {
  return api.get<CustomSegment>(`${BASE}/segments/custom/${id}`);
}

export async function updateCustomSegment(
  id: string,
  payload: UpdateSegmentPayload
): Promise<CustomSegment> {
  return api.patch<CustomSegment>(`${BASE}/segments/custom/${id}`, payload);
}

export async function deleteCustomSegment(
  id: string
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE}/segments/custom/${id}`);
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function createTemplate(
  payload: CreateTemplatePayload
): Promise<PushTemplate> {
  return api.post<PushTemplate>(`${BASE}/templates`, payload);
}

export async function listTemplates(
  query: TemplateQuery = {}
): Promise<PaginatedResponse<PushTemplate>> {
  return api.get(`${BASE}/templates${qs(query)}`);
}

export async function getTemplate(id: string): Promise<PushTemplate> {
  return api.get<PushTemplate>(`${BASE}/templates/${id}`);
}

export async function updateTemplate(
  id: string,
  payload: UpdateTemplatePayload
): Promise<PushTemplate> {
  return api.patch<PushTemplate>(`${BASE}/templates/${id}`, payload);
}

export async function deleteTemplate(
  id: string
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE}/templates/${id}`);
}

// ── Scheduled Notifications ─────────────────────────────────────────────────

export async function createScheduled(
  payload: CreateScheduledPayload
): Promise<ScheduledNotification> {
  return api.post<ScheduledNotification>(`${BASE}/scheduled`, payload);
}

export async function createScheduledMulti(
  payload: CreateScheduledPayload & { schedule_dates: string[] }
): Promise<{ count: number; items: ScheduledNotification[] }> {
  return api.post(`${BASE}/scheduled/multi`, payload);
}

export async function listScheduled(): Promise<ScheduledNotification[]> {
  return api.get<ScheduledNotification[]>(`${BASE}/scheduled`);
}

export async function getScheduled(
  id: string
): Promise<ScheduledNotification> {
  return api.get<ScheduledNotification>(`${BASE}/scheduled/${id}`);
}

export async function updateScheduled(
  id: string,
  payload: UpdateScheduledPayload
): Promise<ScheduledNotification> {
  return api.patch<ScheduledNotification>(
    `${BASE}/scheduled/${id}`,
    payload
  );
}

export async function deleteScheduled(
  id: string
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE}/scheduled/${id}`);
}

export async function toggleScheduled(
  id: string
): Promise<ScheduledNotification> {
  return api.patch<ScheduledNotification>(
    `${BASE}/scheduled/${id}/toggle`,
    {}
  );
}

export async function migrateScheduled(
  id: string
): Promise<ScheduledNotification> {
  return api.patch<ScheduledNotification>(
    `${BASE}/scheduled/${id}/migrate`,
    {}
  );
}

// ── Users ───────────────────────────────────────────────────────────────────

export async function listUsers(
  query: { page?: number; limit?: number; search?: string } = {}
): Promise<PaginatedResponse<PushUser>> {
  return api.get(`${BASE}/users${qs(query)}`);
}

export async function getUserDetail(
  customerId: string
): Promise<PushUserDetail> {
  return api.get<PushUserDetail>(`${BASE}/users/${customerId}`);
}
