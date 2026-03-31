import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import * as pushService from "@/services/pushCampaignService";
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
} from "@/types/push-campaign";

// ── Keys ─────────────────────────────────────────────────────────────────────

const keys = {
  campaigns: (q?: CampaignQuery) => ["push", "campaigns", q] as const,
  campaign: (id: string) => ["push", "campaigns", id] as const,
  stats: () => ["push", "stats"] as const,
  segments: () => ["push", "segments"] as const,
  customSegments: () => ["push", "segments", "custom"] as const,
  customSegment: (id: string) => ["push", "segments", "custom", id] as const,
  templates: (q?: TemplateQuery) => ["push", "templates", q] as const,
  template: (id: string) => ["push", "templates", id] as const,
  scheduled: () => ["push", "scheduled"] as const,
  users: (q?: { page?: number; search?: string }) => ["push", "users", q] as const,
  user: (id: string) => ["push", "users", "detail", id] as const,
};

// ── Campaigns ────────────────────────────────────────────────────────────────

export function useCampaignsQuery(query: CampaignQuery = {}) {
  return useQuery<PaginatedResponse<PushCampaign>>({
    queryKey: keys.campaigns(query),
    queryFn: () => pushService.listCampaigns(query),
    staleTime: 30_000,
  });
}

export function useCampaignQuery(id: string) {
  return useQuery<PushCampaign>({
    queryKey: keys.campaign(id),
    queryFn: () => pushService.getCampaign(id),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) =>
      pushService.createCampaign(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "campaigns"] });
      qc.invalidateQueries({ queryKey: ["push", "stats"] });
      toast.success("Campagne push envoyée avec succès");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'envoi de la campagne");
    },
  });
}

export function useCancelCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pushService.cancelCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "campaigns"] });
      toast.success("Campagne annulée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'annulation");
    },
  });
}

// ── Stats ────────────────────────────────────────────────────────────────────

export function useCampaignStatsQuery() {
  return useQuery<PushCampaignStats>({
    queryKey: keys.stats(),
    queryFn: () => pushService.getCampaignStats(),
    staleTime: 60_000,
  });
}

// ── Segments ─────────────────────────────────────────────────────────────────

export function useSegmentsQuery() {
  return useQuery<PushSegment[]>({
    queryKey: keys.segments(),
    queryFn: () => pushService.getSegments(),
    staleTime: 30_000,
  });
}

export function usePreviewSegmentMutation() {
  return useMutation({
    mutationFn: (payload: SegmentPreviewPayload) =>
      pushService.previewSegment(payload),
  });
}

export function usePreviewCustomFiltersMutation() {
  return useMutation({
    mutationFn: (filters: Record<string, unknown>) =>
      pushService.previewCustomFilters(filters),
  });
}

// ── Custom Segments ─────────────────────────────────────────────────────────

export function useCustomSegmentsQuery() {
  return useQuery<CustomSegment[]>({
    queryKey: keys.customSegments(),
    queryFn: () => pushService.listCustomSegments(),
    staleTime: 30_000,
  });
}

export function useCustomSegmentQuery(id: string) {
  return useQuery<CustomSegment>({
    queryKey: keys.customSegment(id),
    queryFn: () => pushService.getCustomSegment(id),
    enabled: !!id,
  });
}

export function useCreateSegmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSegmentPayload) =>
      pushService.createCustomSegment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "segments"] });
      toast.success("Segment créé avec succès");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création du segment");
    },
  });
}

export function useUpdateSegmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSegmentPayload }) =>
      pushService.updateCustomSegment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "segments"] });
      toast.success("Segment mis à jour");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise à jour du segment");
    },
  });
}

export function useDeleteSegmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pushService.deleteCustomSegment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "segments"] });
      toast.success("Segment supprimé");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression du segment");
    },
  });
}

// ── Templates ────────────────────────────────────────────────────────────────

export function useTemplatesQuery(query: TemplateQuery = {}) {
  return useQuery<PaginatedResponse<PushTemplate>>({
    queryKey: keys.templates(query),
    queryFn: () => pushService.listTemplates(query),
    staleTime: 60_000,
  });
}

export function useTemplateQuery(id: string) {
  return useQuery<PushTemplate>({
    queryKey: keys.template(id),
    queryFn: () => pushService.getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) =>
      pushService.createTemplate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "templates"] });
      toast.success("Template créé avec succès");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création du template");
    },
  });
}

export function useUpdateTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTemplatePayload }) =>
      pushService.updateTemplate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "templates"] });
      toast.success("Template mis à jour");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise à jour du template");
    },
  });
}

export function useDeleteTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pushService.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "templates"] });
      toast.success("Template supprimé");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression du template");
    },
  });
}

// ── Scheduled ────────────────────────────────────────────────────────────────

export function useScheduledQuery() {
  return useQuery<ScheduledNotification[]>({
    queryKey: keys.scheduled(),
    queryFn: () => pushService.listScheduled(),
    staleTime: 30_000,
  });
}

export function useCreateScheduledMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateScheduledPayload) =>
      pushService.createScheduled(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "scheduled"] });
      toast.success("Notification planifiée créée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création");
    },
  });
}

export function useCreateScheduledMultiMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateScheduledPayload & { schedule_dates: string[] }) =>
      pushService.createScheduledMulti(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["push", "scheduled"] });
      toast.success(`${data.count} notification(s) planifiée(s) créée(s)`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création");
    },
  });
}

export function useUpdateScheduledMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateScheduledPayload }) =>
      pushService.updateScheduled(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "scheduled"] });
      toast.success("Notification planifiée mise à jour");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise à jour");
    },
  });
}

export function useToggleScheduledMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pushService.toggleScheduled(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "scheduled"] });
      toast.success("Statut mis à jour");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors du changement de statut");
    },
  });
}

export function useDeleteScheduledMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pushService.deleteScheduled(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "scheduled"] });
      toast.success("Notification planifiée supprimée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression");
    },
  });
}

export function useMigrateScheduledMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pushService.migrateScheduled(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["push", "scheduled"] });
      toast.success("Migration vers Expo Push effectuée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la migration");
    },
  });
}

// ── Users ───────────────────────────────────────────────────────────────────

export function usePushUsersQuery(query: { page?: number; search?: string } = {}) {
  return useQuery<PaginatedResponse<PushUser>>({
    queryKey: keys.users(query),
    queryFn: () => pushService.listUsers(query),
    staleTime: 30_000,
  });
}

export function usePushUserDetailQuery(customerId: string) {
  return useQuery<PushUserDetail>({
    queryKey: keys.user(customerId),
    queryFn: () => pushService.getUserDetail(customerId),
    enabled: !!customerId,
    staleTime: 15_000,
  });
}
