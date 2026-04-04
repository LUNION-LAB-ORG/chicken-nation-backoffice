import { api } from "@/services/api";
import type {
  News,
  NewsListResponse,
  NewsStats,
  NewsQueryParams,
} from "../types/news.types";

const BASE = "/marketing/admin/news";

function qs(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export async function listNews(
  query: NewsQueryParams = {}
): Promise<NewsListResponse> {
  return api.get(`${BASE}${qs(query)}`);
}

export async function getNews(id: string): Promise<News> {
  return api.get<News>(`${BASE}/${id}`);
}

export async function getNewsStats(): Promise<NewsStats> {
  return api.get<NewsStats>(`${BASE}/stats`);
}

export async function createNews(formData: FormData): Promise<{ success: boolean; data: News }> {
  return api.post(`${BASE}`, formData);
}

export async function updateNews(
  id: string,
  formData: FormData
): Promise<{ success: boolean; data: News }> {
  return api.patch(`${BASE}/${id}`, formData);
}

export async function toggleNewsActive(
  id: string
): Promise<{ success: boolean; data: News }> {
  return api.patch(`${BASE}/${id}/toggle-active`, {});
}

export async function deleteNews(
  id: string
): Promise<{ success: boolean }> {
  return api.delete(`${BASE}/${id}`);
}
