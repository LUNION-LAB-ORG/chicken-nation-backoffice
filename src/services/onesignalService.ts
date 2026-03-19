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

// ── Tags Sync ───────────────────────────────────────────────────────────────

export async function triggerTagsSync(): Promise<{ message: string }> {
  return api.post<{ message: string }>(`${BASE}/tags/sync`, {});
}
