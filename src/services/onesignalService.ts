import { api } from "@/services/api";
import type {
  OnesignalMessage,
  CreateMessagePayload,
  ViewMessagesQuery,
  OnesignalTemplate,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  ViewTemplatesQuery,
  OnesignalSegment,
  CreateSegmentPayload,
  UpdateSegmentPayload,
  ViewSegmentsQuery,
  ScheduledNotification,
  CreateScheduledNotificationPayload,
  UpdateScheduledNotificationPayload,
  ScheduledNotificationListResponse,
  OnesignalUserListResponse,
  OnesignalUserDetail,
  UpdateUserPayload,
  CreateAliasPayload,
  UpdateSubscriptionPayload,
  ViewOutcomesQuery,
} from "@/types/onesignal";

const BASE = "/onesignal";

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

// ── Messages ─────────────────────────────────────────────────────────────────

export async function createMessage(
  payload: CreateMessagePayload
): Promise<OnesignalMessage> {
  return api.post<OnesignalMessage>(`${BASE}/messages`, payload);
}

export async function viewMessages(
  query: ViewMessagesQuery = {}
): Promise<{ notifications: OnesignalMessage[]; total_count: number }> {
  return api.get(`${BASE}/messages${qs(query)}`);
}

export async function viewMessage(id: string): Promise<OnesignalMessage> {
  return api.get<OnesignalMessage>(`${BASE}/messages/${id}`);
}

export async function cancelMessage(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE}/messages/${id}`);
}

export async function messageHistory(
  id: string,
  events: string = "sent"
): Promise<unknown> {
  return api.post(`${BASE}/messages/${id}/history`, { events });
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function createTemplate(
  payload: CreateTemplatePayload
): Promise<OnesignalTemplate> {
  return api.post<OnesignalTemplate>(`${BASE}/templates`, payload);
}

export async function viewTemplates(
  query: ViewTemplatesQuery = {}
): Promise<{ templates: OnesignalTemplate[]; total_count: number }> {
  return api.get(`${BASE}/templates${qs(query)}`);
}

export async function viewTemplate(id: string): Promise<OnesignalTemplate> {
  return api.get<OnesignalTemplate>(`${BASE}/templates/${id}`);
}

export async function updateTemplate(
  id: string,
  payload: UpdateTemplatePayload
): Promise<OnesignalTemplate> {
  return api.patch<OnesignalTemplate>(`${BASE}/templates/${id}`, payload);
}

export async function deleteTemplate(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE}/templates/${id}`);
}

// ── Segments ─────────────────────────────────────────────────────────────────

export async function viewSegments(
  query: ViewSegmentsQuery = {}
): Promise<{ segments: OnesignalSegment[]; total_count: number }> {
  return api.get(`${BASE}/segments${qs(query)}`);
}

export async function createSegment(
  payload: CreateSegmentPayload
): Promise<OnesignalSegment> {
  return api.post<OnesignalSegment>(`${BASE}/segments`, payload);
}

export async function updateSegment(
  id: string,
  payload: UpdateSegmentPayload
): Promise<OnesignalSegment> {
  return api.patch<OnesignalSegment>(`${BASE}/segments/${id}`, payload);
}

export async function deleteSegment(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE}/segments/${id}`);
}

// ── Scheduled Notifications ─────────────────────────────────────────────────

export async function createScheduledNotification(
  payload: CreateScheduledNotificationPayload
): Promise<ScheduledNotification> {
  return api.post<ScheduledNotification>(`${BASE}/scheduled`, payload);
}

export async function listScheduledNotifications(
  page = 1,
  limit = 20
): Promise<ScheduledNotificationListResponse> {
  return api.get(`${BASE}/scheduled${qs({ page, limit })}`);
}

export async function getScheduledNotification(
  id: string
): Promise<ScheduledNotification> {
  return api.get<ScheduledNotification>(`${BASE}/scheduled/${id}`);
}

export async function updateScheduledNotification(
  id: string,
  payload: UpdateScheduledNotificationPayload
): Promise<ScheduledNotification> {
  return api.patch<ScheduledNotification>(`${BASE}/scheduled/${id}`, payload);
}

export async function toggleScheduledNotification(
  id: string,
  active: boolean
): Promise<ScheduledNotification> {
  return api.patch<ScheduledNotification>(`${BASE}/scheduled/${id}/toggle`, {
    active,
  });
}

export async function deleteScheduledNotification(
  id: string
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE}/scheduled/${id}`);
}

// ── Users ───────────────────────────────────────────────────────────────────

export async function listOnesignalUsers(
  query: { page?: number; limit?: number; search?: string } = {}
): Promise<OnesignalUserListResponse> {
  return api.get(`${BASE}/users${qs(query)}`);
}

export async function viewUser(
  externalId: string
): Promise<OnesignalUserDetail> {
  return api.get<OnesignalUserDetail>(`${BASE}/users/${externalId}`);
}

export async function updateUser(
  externalId: string,
  payload: UpdateUserPayload
): Promise<unknown> {
  return api.patch(`${BASE}/users/${externalId}`, payload);
}

export async function deleteUser(
  externalId: string
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE}/users/${externalId}`);
}

// ── Aliases ─────────────────────────────────────────────────────────────────

export async function fetchAliases(
  externalId: string
): Promise<{ identity: Record<string, string> }> {
  return api.get(`${BASE}/users/${externalId}/aliases`);
}

export async function createAlias(
  externalId: string,
  payload: CreateAliasPayload
): Promise<unknown> {
  return api.post(`${BASE}/users/${externalId}/aliases`, payload);
}

export async function deleteAlias(
  externalId: string,
  label: string
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(
    `${BASE}/users/${externalId}/aliases/${label}`
  );
}

// ── Subscriptions ───────────────────────────────────────────────────────────

export async function updateSubscription(
  subscriptionId: string,
  payload: UpdateSubscriptionPayload
): Promise<unknown> {
  return api.patch(`${BASE}/subscriptions/${subscriptionId}`, payload);
}

export async function deleteSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(
    `${BASE}/subscriptions/${subscriptionId}`
  );
}

// ── Analytics ───────────────────────────────────────────────────────────────

export async function viewOutcomes(
  query: ViewOutcomesQuery = {}
): Promise<{ outcomes: unknown[] }> {
  return api.get(`${BASE}/analytics/outcomes${qs(query)}`);
}

export async function exportCsvPlayers(
  extraFields?: string[],
  segmentName?: string
): Promise<{ csv_file_url: string }> {
  return api.post(`${BASE}/analytics/export/players`, {
    extra_fields: extraFields,
    segment_name: segmentName,
  });
}

// ── Tags Sync ───────────────────────────────────────────────────────────────

export async function triggerTagsSync(): Promise<{ message: string }> {
  return api.post<{ message: string }>(`${BASE}/tags/sync`, {});
}
