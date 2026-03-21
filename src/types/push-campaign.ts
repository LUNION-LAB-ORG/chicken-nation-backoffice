// ─── Push Campaign Types (Expo Push) ────────────────────────────────────────

// ── Campaigns ───────────────────────────────────────────────────────────────

export interface PushCampaign {
  id: string;
  name: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  image_url?: string | null;
  target_type: "all" | "segment" | "filters" | "ids";
  target_config: Record<string, unknown>;
  total_targeted: number;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  status: "draft" | "sent" | "scheduled" | "failed";
  scheduled_at?: string | null;
  sent_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignPayload {
  name: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  image_url?: string;
  target_type: "all" | "segment" | "filters" | "ids";
  target_config: Record<string, unknown>;
  scheduled_at?: string;
}

export interface CampaignQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Templates ───────────────────────────────────────────────────────────────

export interface PushTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  image_url?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplatePayload {
  name: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  image_url?: string;
}

export interface UpdateTemplatePayload extends Partial<CreateTemplatePayload> {}

export interface TemplateQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// ── Segments ────────────────────────────────────────────────────────────────

export interface PushSegment {
  key: string;
  label: string;
  count: number;
  description: string;
  is_system: boolean;
  id?: string;
}

export interface SegmentPreviewPayload {
  target_type: "all" | "segment" | "filters" | "ids";
  target_config: Record<string, unknown>;
}

// ── Custom Segments ──────────────────────────────────────────────────────

export interface SegmentFilters {
  name_contains?: string;
  phone_contains?: string;
  email_contains?: string;
  min_orders?: number;
  max_orders?: number;
  min_spent?: number;
  max_spent?: number;
  loyalty_level?: string;
  city?: string;
  min_points?: number;
  max_points?: number;
  registered_after?: string;
  registered_before?: string;
  last_order_days?: number;
  no_order_days?: number;
}

export interface CustomSegment {
  id: string;
  name: string;
  description: string | null;
  filters: SegmentFilters;
  is_system: boolean;
  count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentPayload {
  name: string;
  description?: string;
  filters: SegmentFilters;
}

export interface UpdateSegmentPayload {
  name?: string;
  description?: string;
  filters?: SegmentFilters;
}

// ── Scheduled ───────────────────────────────────────────────────────────────

export type ScheduleType = "once" | "daily" | "weekly" | "monthly" | "custom";

export interface ScheduledNotification {
  id: string;
  name: string;
  channel: string;
  payload: {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    image_url?: string;
  };
  targeting: {
    type: "all" | "segment" | "filters" | "ids";
    config: Record<string, unknown>;
  };
  schedule_type: ScheduleType;
  cron_expression?: string | null;
  scheduled_at?: string | null;
  timezone: string;
  active: boolean;
  last_sent_at?: string | null;
  next_run_at?: string | null;
  send_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledPayload {
  name: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  image_url?: string;
  target_type: "all" | "segment" | "filters" | "ids";
  target_config: Record<string, unknown>;
  schedule_type: ScheduleType;
  cron_expression?: string;
  scheduled_at?: string;
  timezone?: string;
}

export interface UpdateScheduledPayload extends Partial<CreateScheduledPayload> {}

// ── Users ───────────────────────────────────────────────────────────────────

export interface PushUser {
  customer_id: string;
  push: boolean;
  promotions: boolean;
  system: boolean;
  expo_push_token: string | null;
  active: boolean;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string;
    loyalty_level: string | null;
    created_at: string;
  };
}

export interface PushUserDetail {
  customer_id: string;
  push: boolean;
  promotions: boolean;
  system: boolean;
  expo_push_token: string | null;
  active: boolean;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string;
    email: string | null;
    loyalty_level: string | null;
    total_points: number;
    created_at: string;
    orders: { id: string; amount: number; completed_at: string | null }[];
    addresses: { city: string | null }[];
  };
}

// ── Stats ───────────────────────────────────────────────────────────────────

export interface PushCampaignStats {
  totalCampaigns: number;
  totalSent: number;
  totalFailed: number;
  recentCampaigns: Pick<
    PushCampaign,
    "id" | "name" | "status" | "total_targeted" | "total_sent" | "total_failed" | "sent_at" | "created_at"
  >[];
}
