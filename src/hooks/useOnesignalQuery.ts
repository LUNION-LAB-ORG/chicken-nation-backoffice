import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import * as onesignalService from "@/services/onesignalService";
import type {
  OnesignalMessage,
  OnesignalTemplate,
  OnesignalSegment,
  CreateMessagePayload,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  CreateSegmentPayload,
  UpdateSegmentPayload,
  ViewMessagesQuery,
  ViewTemplatesQuery,
  ViewSegmentsQuery,
  ScheduledNotificationListResponse,
  CreateScheduledNotificationPayload,
  UpdateScheduledNotificationPayload,
} from "@/types/onesignal";

// ── Keys ─────────────────────────────────────────────────────────────────────

const keys = {
  messages: (q?: ViewMessagesQuery) => ["onesignal", "messages", q] as const,
  message: (id: string) => ["onesignal", "messages", id] as const,
  templates: (q?: ViewTemplatesQuery) => ["onesignal", "templates", q] as const,
  template: (id: string) => ["onesignal", "templates", id] as const,
  segments: (q?: ViewSegmentsQuery) => ["onesignal", "segments", q] as const,
  scheduled: (page?: number) => ["onesignal", "scheduled", page] as const,
};

// ── Messages ─────────────────────────────────────────────────────────────────

export function useMessagesQuery(query: ViewMessagesQuery = {}) {
  return useQuery<{ notifications: OnesignalMessage[]; total_count: number }>({
    queryKey: keys.messages(query),
    queryFn: () => onesignalService.viewMessages(query),
    staleTime: 30_000,
  });
}

export function useMessageQuery(id: string) {
  return useQuery<OnesignalMessage>({
    queryKey: keys.message(id),
    queryFn: () => onesignalService.viewMessage(id),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMessagePayload) =>
      onesignalService.createMessage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "messages"] });
      toast.success("Notification envoyée avec succès");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'envoi de la notification");
    },
  });
}

export function useCancelMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => onesignalService.cancelMessage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "messages"] });
      toast.success("Notification annulée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'annulation");
    },
  });
}

// ── Templates ────────────────────────────────────────────────────────────────

export function useTemplatesQuery(query: ViewTemplatesQuery = {}) {
  return useQuery<{ templates: OnesignalTemplate[]; total_count: number }>({
    queryKey: keys.templates(query),
    queryFn: () => onesignalService.viewTemplates(query),
    staleTime: 60_000,
  });
}

export function useTemplateQuery(id: string) {
  return useQuery<OnesignalTemplate>({
    queryKey: keys.template(id),
    queryFn: () => onesignalService.viewTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) =>
      onesignalService.createTemplate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "templates"] });
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
      onesignalService.updateTemplate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "templates"] });
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
    mutationFn: (id: string) => onesignalService.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "templates"] });
      toast.success("Template supprimé");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression du template");
    },
  });
}

// ── Segments ─────────────────────────────────────────────────────────────────

export function useSegmentsQuery(query: ViewSegmentsQuery = {}) {
  return useQuery<{ segments: OnesignalSegment[]; total_count: number }>({
    queryKey: keys.segments(query),
    queryFn: () => onesignalService.viewSegments(query),
    staleTime: 60_000,
  });
}

export function useCreateSegmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSegmentPayload) =>
      onesignalService.createSegment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "segments"] });
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
      onesignalService.updateSegment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "segments"] });
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
    mutationFn: (id: string) => onesignalService.deleteSegment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "segments"] });
      toast.success("Segment supprimé");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression du segment");
    },
  });
}

// ── Scheduled Notifications ─────────────────────────────────────────────────

export function useScheduledNotificationsQuery(page = 1) {
  return useQuery<ScheduledNotificationListResponse>({
    queryKey: keys.scheduled(page),
    queryFn: () => onesignalService.listScheduledNotifications(page),
    staleTime: 30_000,
  });
}

export function useCreateScheduledMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateScheduledNotificationPayload) =>
      onesignalService.createScheduledNotification(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "scheduled"] });
      toast.success("Notification planifiée créée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création");
    },
  });
}

export function useUpdateScheduledMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateScheduledNotificationPayload;
    }) => onesignalService.updateScheduledNotification(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "scheduled"] });
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
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      onesignalService.toggleScheduledNotification(id, active),
    onSuccess: (_, { active }) => {
      qc.invalidateQueries({ queryKey: ["onesignal", "scheduled"] });
      toast.success(active ? "Notification activée" : "Notification désactivée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors du changement de statut");
    },
  });
}

export function useDeleteScheduledMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      onesignalService.deleteScheduledNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onesignal", "scheduled"] });
      toast.success("Notification planifiée supprimée");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression");
    },
  });
}
