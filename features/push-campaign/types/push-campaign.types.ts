export interface PushCampaign {
  id: string;
  name: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  image_url: string | null;
  target_type: 'all' | 'segment' | 'filters' | 'ids';
  target_config: Record<string, unknown>;
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  scheduled_at: string | null;
  sent_at: string | null;
  total_targeted: number;
  total_sent: number;
  total_failed: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PushCampaignListResponse {
  items: PushCampaign[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateCampaignPayload {
  name: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  image_url?: string;
  target_type: 'all' | 'segment' | 'filters' | 'ids';
  target_config: Record<string, unknown>;
  scheduled_at?: string;
}

export interface CampaignQueryParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'sent' | 'scheduled' | 'failed';
  search?: string;
}
