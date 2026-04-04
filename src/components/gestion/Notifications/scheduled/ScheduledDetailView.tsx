"use client";

import React from "react";
import type { ScheduledNotification } from "@/types/push-campaign";
import {
  useToggleScheduledMutation,
  useDeleteScheduledMutation,
  useMigrateScheduledMutation,
} from "@/hooks/usePushCampaignQuery";
import {
  ArrowLeft,
  Bell,
  Clock,
  Repeat,
  CalendarClock,
  User,
  Users,
  Pause,
  Play,
  Trash2,
  Pencil,
  ArrowRightLeft,
  Send,
  Image as ImageIcon,
} from "lucide-react";

interface Props {
  item: ScheduledNotification;
  onBack: () => void;
  onEdit: (item: ScheduledNotification) => void;
}

const SCHEDULE_LABELS: Record<string, string> = {
  once: "Une seule fois",
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  custom: "Personnalisé (CRON)",
};

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  expo_push: { label: "Expo Push", color: "bg-blue-100 text-blue-700" },
  push: { label: "OneSignal", color: "bg-purple-100 text-purple-700" },
  email: { label: "Email", color: "bg-amber-100 text-amber-700" },
  sms: { label: "SMS", color: "bg-teal-100 text-teal-700" },
};

const TARGET_LABELS: Record<string, string> = {
  all: "Tous les abonnés",
  segment: "Segment",
  filters: "Filtres personnalisés",
  ids: "Utilisateurs spécifiques",
};

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function ScheduledDetailView({ item, onBack, onEdit }: Props) {
  const toggleMutation = useToggleScheduledMutation();
  const deleteMutation = useDeleteScheduledMutation();
  const migrateMutation = useMigrateScheduledMutation();

  const payload = item.payload;
  const targeting = item.targeting;
  const title = payload?.title || item.name;
  const body = payload?.body || "";
  const imageUrl = payload?.image_url || "";
  const channelInfo = CHANNEL_LABELS[item.channel] ?? { label: item.channel, color: "bg-gray-100 text-gray-600" };
  const isOneSignal = item.channel !== "expo_push";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Retour aux planifications
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFF3E8] flex items-center justify-center">
              <Bell size={20} className="text-[#F17922]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {item.active ? "Actif" : "Inactif"}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${channelInfo.color}`}>
                  {channelInfo.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Créé le {formatDate(item.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
            >
              <Pencil size={14} /> Modifier
            </button>
            <button
              onClick={() => toggleMutation.mutate(item.id)}
              disabled={toggleMutation.isPending}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl cursor-pointer disabled:opacity-50 ${
                item.active
                  ? "text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                  : "text-green-700 bg-green-50 hover:bg-green-100"
              }`}
            >
              {item.active ? <Pause size={14} /> : <Play size={14} />}
              {item.active ? "Désactiver" : "Activer"}
            </button>
            {isOneSignal && (
              <button
                onClick={() => {
                  if (confirm(`Migrer "${item.name}" vers Expo Push ?`)) {
                    migrateMutation.mutate(item.id);
                  }
                }}
                disabled={migrateMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 cursor-pointer disabled:opacity-50"
              >
                <ArrowRightLeft size={14} /> Migrer
              </button>
            )}
            <button
              onClick={() => {
                if (confirm(`Supprimer "${item.name}" ?`)) {
                  deleteMutation.mutate(item.id, { onSuccess: onBack });
                }
              }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Send size={18} />}
          label="Envois effectués"
          value={item.send_count.toString()}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Type de planification"
          value={SCHEDULE_LABELS[item.schedule_type] ?? item.schedule_type}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={<CalendarClock size={18} />}
          label="Prochain envoi"
          value={item.active && item.next_run_at ? formatDate(item.next_run_at) : "—"}
          color="bg-orange-50 text-orange-600"
          small
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Dernier envoi"
          value={item.last_sent_at ? formatDate(item.last_sent_at) : "Jamais"}
          color="bg-gray-50 text-gray-600"
          small
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Content */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Contenu de la notification</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Titre</p>
                <p className="text-sm text-gray-900 font-medium bg-gray-50 rounded-lg px-3 py-2.5">
                  {title || <span className="text-gray-400 italic">Aucun titre défini</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Message</p>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
                  {body || <span className="text-gray-400 italic">Aucun message défini</span>}
                </p>
              </div>
              {imageUrl && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Image</p>
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2.5">
                    <ImageIcon size={14} />
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                      {imageUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Planification</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.schedule_type === "once" ? <Clock size={14} className="text-gray-400" /> : <Repeat size={14} className="text-gray-400" />}
                  <span className="text-sm text-gray-600">Type</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {SCHEDULE_LABELS[item.schedule_type] ?? item.schedule_type}
                </span>
              </div>

              {item.cron_expression && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expression CRON</span>
                  <code className="text-xs bg-gray-100 px-2.5 py-1 rounded-lg font-mono text-gray-700">
                    {item.cron_expression}
                  </code>
                </div>
              )}

              {item.scheduled_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Date programmée</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(item.scheduled_at)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fuseau horaire</span>
                <span className="text-sm font-medium text-gray-900">{item.timezone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview + Targeting */}
        <div className="space-y-6">
          {/* Phone Preview */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Aperçu</h4>
            <div className="bg-gray-50 rounded-2xl p-4 flex justify-center">
              <div className="w-[260px]">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="bg-gray-100 px-4 py-2 flex items-center justify-center">
                    <div className="w-16 h-1 bg-gray-300 rounded-full" />
                  </div>
                  <div className="p-3">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 bg-[#F17922] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bell size={14} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {title || "Notification"}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-3">
                            {body || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Targeting */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Ciblage</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {targeting?.type === "all" ? (
                  <Users size={14} className="text-gray-400" />
                ) : (
                  <User size={14} className="text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {TARGET_LABELS[targeting?.type] ?? targeting?.type ?? "Tous"}
                </span>
              </div>
              {targeting?.type === "segment" && targeting?.config?.segment && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    {(targeting.config as any).segment}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Data */}
          {payload?.data && Object.keys(payload.data).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Données additionnelles</h4>
              <pre className="text-xs text-gray-700 font-mono bg-gray-50 rounded-lg p-3 whitespace-pre-wrap break-all">
                {JSON.stringify(payload.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-bold text-gray-900 truncate ${small ? "text-sm" : "text-lg"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
