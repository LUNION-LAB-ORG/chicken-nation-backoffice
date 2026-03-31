export enum RetentionCallbackStatus {
  CALLED = 'CALLED',
  NO_ANSWER = 'NO_ANSWER',
  CALLBACK_SCHEDULED = 'CALLBACK_SCHEDULED',
  RECONQUERED = 'RECONQUERED',
  LOST = 'LOST',
}

export interface IRetentionCallbackCustomer {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  image?: string | null;
}

export interface IRetentionCallbackCaller {
  id: string;
  fullname?: string;
  email?: string;
  image?: string | null;
}

export interface IRetentionCallbackReason {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  position: number;
}

export interface IRetentionCallback {
  id: string;
  customer_id: string;
  caller_user_id: string;
  reason_id?: string | null;
  status: RetentionCallbackStatus;
  notes?: string | null;
  called_at: string;
  next_callback_at?: string | null;
  reconquered_at?: string | null;
  parent_id?: string | null;
  customer: IRetentionCallbackCustomer;
  caller: IRetentionCallbackCaller;
  reason?: { id: string; name: string } | null;
  followups?: IRetentionCallback[];
  created_at: string;
  updated_at: string;
}

export interface IRetentionCallbackPaginated {
  data: IRetentionCallback[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface IRetentionCallbackFilters {
  page?: number;
  limit?: number;
  status?: RetentionCallbackStatus[];
  reason_id?: string[];
  caller_user_id?: string[];
  customer_id?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ICreateRetentionCallbackDTO {
  customer_id: string;
  reason_id?: string;
  status?: RetentionCallbackStatus;
  notes?: string;
  next_callback_at?: string;
  parent_id?: string;
}

export interface IUpdateRetentionCallbackDTO {
  reason_id?: string;
  status?: RetentionCallbackStatus;
  notes?: string;
  next_callback_at?: string;
}

export interface ICreateReasonDTO {
  name: string;
  description?: string;
  is_active?: boolean;
  position?: number;
}

export interface IUpdateReasonDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
  position?: number;
}

// Stats types
export interface IRetentionOverview {
  total: number;
  called: number;
  noAnswer: number;
  scheduled: number;
  reconquered: number;
  lost: number;
  reconquestRate: number;
}

export interface IRetentionByReason {
  reasonId: string;
  reasonName: string;
  count: number;
}

export interface IRetentionAgentPerformance {
  userId: string;
  fullname: string;
  image: string | null;
  totalCalls: number;
  reconquered: number;
  reconquestRate: number;
}

export interface IRetentionFunnel {
  called: number;
  scheduled: number;
  reconquered: number;
  lost: number;
}

export interface IRetentionTrend {
  date: string;
  total: number;
  reconquered: number;
}
