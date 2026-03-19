"use client";

import React from "react";
import {
  useScheduledNotificationsQuery,
  useToggleScheduledMutation,
  useDeleteScheduledMutation,
} from "@/hooks/useOnesignalQuery";
import type { ScheduledNotification } from "@/types/onesignal";
import {
  Clock,
  Repeat,
  CalendarClock,
  Trash2,
  Loader2,
  Bell,
  Mail,
  MessageSquare,
  Pause,
  Play,
} from "lucide-react";

interface Props {
  searchQuery: string;
  onEdit: (item: ScheduledNotification) => void;
  onCreate: () => void;
}

const SCHEDULE_LABELS: Record<string, string> = {
  once: "Une seule fois",
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  custom: "Personnalisé",
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  push: <Bell size={14} />,
  email: <Mail size={14} />,
  sms: <MessageSquare size={14} />,
};

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatCron(notif: ScheduledNotification): string {
  if (notif.schedule_type === "once") {
    return formatDate(notif.scheduled_at);
  }
  if (notif.cron_expression) {
    return notif.cron_expression;
  }
  return SCHEDULE_LABELS[notif.schedule_type] ?? notif.schedule_type;
}

export default function ScheduledList({ searchQuery, onEdit, onCreate }: Props) {
  const { data, isLoading } = useScheduledNotificationsQuery();
  const toggleMutation = useToggleScheduledMutation();
  const deleteMutation = useDeleteScheduledMutation();

  const items = data?.items ?? [];

  const filtered = searchQuery
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <CalendarClock size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-sm mb-4">
          Aucune notification planifiée
        </p>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-[#F17922] text-white rounded-xl text-sm font-medium hover:bg-[#e06816] transition-all cursor-pointer"
        >
          Créer une notification planifiée
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((item) => {
        const payload = item.payload as Record<string, unknown>;
        const headings = payload.headings as Record<string, string> | undefined;
        const contents = payload.contents as Record<string, string> | undefined;
        const title = headings?.fr ?? headings?.en ?? item.name;
        const body =
          contents?.fr ?? contents?.en ?? payload.email_subject ?? "";

        return (
          <div
            key={item.id}
            onClick={() => onEdit(item)}
            className={`border rounded-2xl p-4 transition-all cursor-pointer hover:shadow-md ${
              item.active
                ? "border-gray-200 bg-white"
                : "border-gray-100 bg-gray-50 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-gray-400">
                    {CHANNEL_ICONS[item.channel] ?? <Bell size={14} />}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {item.active ? "Actif" : "Inactif"}
                  </span>
                </div>

                {body && (
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {String(body)}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    {item.schedule_type === "once" ? (
                      <Clock size={12} />
                    ) : (
                      <Repeat size={12} />
                    )}
                    {SCHEDULE_LABELS[item.schedule_type] ?? item.schedule_type}
                    {item.cron_expression && item.schedule_type !== "once" && (
                      <code className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        {item.cron_expression}
                      </code>
                    )}
                  </span>

                  {item.next_run_at && item.active && (
                    <span className="flex items-center gap-1">
                      <CalendarClock size={12} />
                      Prochain : {formatDate(item.next_run_at)}
                    </span>
                  )}

                  {item.send_count > 0 && (
                    <span>
                      {item.send_count} envoi{item.send_count > 1 ? "s" : ""}
                    </span>
                  )}

                  {item.last_sent_at && (
                    <span>Dernier : {formatDate(item.last_sent_at)}</span>
                  )}
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMutation.mutate({
                      id: item.id,
                      active: !item.active,
                    });
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={item.active ? "Désactiver" : "Activer"}
                >
                  {item.active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        `Supprimer la notification planifiée "${item.name}" ?`
                      )
                    ) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
