// ─── OneSignal Types ─────────────────────────────────────────────────────────

// ── Messages ─────────────────────────────────────────────────────────────────

export type TargetChannel = "push" | "email" | "sms";

export interface OnesignalMessage {
  id: string;
  name?: string;
  headings?: Record<string, string>;
  contents?: Record<string, string>;
  target_channel?: TargetChannel;
  included_segments?: string[];
  excluded_segments?: string[];
  template_id?: string;
  // Stats
  successful?: number;
  failed?: number;
  errored?: number;
  converted?: number;
  received?: number;
  remaining?: number;
  queued_at?: number;
  send_after?: number;
  completed_at?: number;
  canceled?: boolean;
  // Platform
  isIos?: boolean;
  isAndroid?: boolean;
  isChrome?: boolean;
  isSafari?: boolean;
  // Extras
  url?: string;
  big_picture?: string;
  ios_attachments?: Record<string, string>;
  data?: Record<string, unknown>;
}

export interface CreateMessagePayload {
  target_channel?: TargetChannel;
  // Push
  contents?: Record<string, string>;
  headings?: Record<string, string>;
  url?: string;
  big_picture?: string;
  // Email
  email_subject?: string;
  email_body?: string;
  email_from_name?: string;
  email_from_address?: string;
  // SMS
  sms_from?: string;
  sms_media_urls?: string[];
  name?: string;
  // Targeting — OneSignal uses "included_segments" (not "include_segments")
  included_segments?: string[];
  excluded_segments?: string[];
  include_aliases?: { external_id: string[] };
  include_subscription_ids?: string[];
  filters?: OnesignalFilter[];
  // Scheduling
  send_after?: string;
  delayed_option?: string;
  delivery_time_of_day?: string;
  // Template
  template_id?: string;
  // Platform toggles
  isIos?: boolean;
  isAndroid?: boolean;
  isChrome?: boolean;
  isSafari?: boolean;
}

export interface ViewMessagesQuery {
  limit?: number;
  offset?: number;
  kind?: number;
}

export interface OnesignalPaginatedResponse<T> {
  total_count?: number;
  offset?: number;
  limit?: number;
  notifications?: T[];
  templates?: T[];
  segments?: T[];
}

// ── Templates ────────────────────────────────────────────────────────────────

export interface OnesignalTemplate {
  id: string;
  name: string;
  // Push
  headings?: Record<string, string>;
  contents?: Record<string, string>;
  url?: string;
  big_picture?: string;
  // Email
  isEmail?: boolean;
  email_subject?: string;
  email_body?: string;
  // SMS
  isSMS?: boolean;
  sms_from?: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface CreateTemplatePayload {
  name: string;
  // Push
  contents?: Record<string, string>;
  headings?: Record<string, string>;
  url?: string;
  big_picture?: string;
  // Email
  isEmail?: boolean;
  email_subject?: string;
  email_body?: string;
  // SMS
  isSMS?: boolean;
  sms_from?: string;
  // Platforms
  isIos?: boolean;
  isAndroid?: boolean;
  isChrome?: boolean;
  isSafari?: boolean;
}

export interface UpdateTemplatePayload extends Partial<CreateTemplatePayload> {}

export interface ViewTemplatesQuery {
  limit?: number;
  offset?: number;
  channel?: string;
}

// ── Segments ─────────────────────────────────────────────────────────────────

export interface OnesignalFilter {
  field: string;
  relation?: string;
  value?: string;
  key?: string;
  hours_ago?: string;
  radius?: number;
  lat?: string;
  long?: string;
  operator?: "OR" | "AND";
}

export interface OnesignalSegment {
  id: string;
  name: string;
  filters?: OnesignalFilter[];
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface CreateSegmentPayload {
  name: string;
  filters: OnesignalFilter[];
}

export interface UpdateSegmentPayload {
  name: string;
  filters?: OnesignalFilter[];
}

export interface ViewSegmentsQuery {
  limit?: number;
  offset?: number;
}
