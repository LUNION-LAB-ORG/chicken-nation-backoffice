export interface News {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  link: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsListResponse {
  data: News[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NewsStats {
  total: number;
  active: number;
  inactive: number;
}

export interface CreateNewsPayload {
  title: string;
  content?: string;
  link?: string;
  isActive?: boolean;
}

export interface UpdateNewsPayload extends Partial<CreateNewsPayload> {}

export interface NewsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
