import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import * as newsApi from "../apis/news.api";
import type { NewsListResponse, NewsStats, News, NewsQueryParams } from "../types/news.types";

const keys = {
  all: () => ["news"] as const,
  list: (q?: NewsQueryParams) => ["news", "list", q] as const,
  detail: (id: string) => ["news", "detail", id] as const,
  stats: () => ["news", "stats"] as const,
};

export function useNewsListQuery(query: NewsQueryParams = {}) {
  return useQuery<NewsListResponse>({
    queryKey: keys.list(query),
    queryFn: () => newsApi.listNews(query),
    staleTime: 30_000,
  });
}

export function useNewsQuery(id: string) {
  return useQuery<News>({
    queryKey: keys.detail(id),
    queryFn: () => newsApi.getNews(id),
    enabled: !!id,
  });
}

export function useNewsStatsQuery() {
  return useQuery<NewsStats>({
    queryKey: keys.stats(),
    queryFn: () => newsApi.getNewsStats(),
    staleTime: 60_000,
  });
}

export function useCreateNewsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => newsApi.createNews(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all() });
      toast.success("Nouveauté créée avec succès");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création");
    },
  });
}

export function useUpdateNewsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      newsApi.updateNews(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all() });
      toast.success("Nouveauté mise à jour");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise à jour");
    },
  });
}

export function useToggleNewsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => newsApi.toggleNewsActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors du changement de statut");
    },
  });
}

export function useDeleteNewsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => newsApi.deleteNews(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all() });
      toast.success("Nouveauté supprimée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression");
    },
  });
}
