"use client";

import React from "react";
import { useCampaignQuery } from "@/hooks/usePushCampaignQuery";
import type { PushCampaign } from "@/types/push-campaign";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  XCircle,
  Users,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  campaign: PushCampaign;
  onBack: () => void;
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(n?: number) {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("fr-FR");
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    sent: "bg-green-50 text-green-600",
    failed: "bg-red-50 text-red-600",
    scheduled: "bg-yellow-50 text-yellow-600",
    draft: "bg-blue-50 text-blue-600",
  };
  const labels: Record<string, string> = {
    sent: "Envoyé",
    failed: "Échoué",
    scheduled: "Planifié",
    draft: "Brouillon",
  };

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${styles[status] ?? styles.draft}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function MessageDetail({ campaign: initialCampaign, onBack }: Props) {
  const { data: freshCampaign, isLoading } = useCampaignQuery(initialCampaign.id);
  const campaign = freshCampaign ?? initialCampaign;

  const copyCampaignId = () => {
    navigator.clipboard.writeText(campaign.id);
    toast.success("ID copié dans le presse-papiers");
  };

  const targetType = campaign.target_type;
  const targetConfig = campaign.target_config as Record<string, any>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Retour aux campagnes
        </button>

        <div className="flex items-center gap-3">
          <Bell size={20} className="text-[#F17922]" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">
                {campaign.name || campaign.title || "Campagne"}
              </h3>
              {getStatusBadge(campaign.status)}
              {isLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Push &middot; Envoyé le {formatDate(campaign.sent_at ?? campaign.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Ciblés</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.total_targeted)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Envoyés</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.total_sent)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Livrés</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.total_delivered)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Échoués</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.total_failed)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Statistiques de livraison
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Audience ciblée</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatNumber(campaign.total_targeted)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-sm text-gray-600">Envoyés avec succès</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatNumber(campaign.total_sent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-sm text-gray-600">Échoués</span>
                </div>
                <span className="text-sm font-medium text-red-500">
                  {formatNumber(campaign.total_failed)}
                </span>
              </div>

              {/* Progress bar */}
              {campaign.total_targeted > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (campaign.total_sent / campaign.total_targeted) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    {((campaign.total_sent / (campaign.total_targeted || 1)) * 100).toFixed(1)}% envoyés
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Paramètres de la campagne
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Contenu
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-gray-500 min-w-[120px]">Titre</span>
                    <span className="text-sm text-gray-900 font-medium">{campaign.title}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-gray-500 min-w-[120px]">Message</span>
                    <span className="text-sm text-gray-900">{campaign.body}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 min-w-[120px]">ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                        {campaign.id}
                      </code>
                      <button
                        onClick={copyCampaignId}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Ciblage
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-gray-500 min-w-[120px]">Type</span>
                    <span className="text-sm text-gray-900">{targetType}</span>
                  </div>
                  {targetType === "segment" && targetConfig.segment && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Segment</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {targetConfig.segment}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Planification
                </p>
                <div className="flex items-start gap-3">
                  <span className="text-sm text-gray-500 min-w-[120px]">Envoyé le</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(campaign.sent_at ?? campaign.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Aperçu
            </h4>
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
                            {campaign.title || "Notification"}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-3">
                            {campaign.body || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Actions rapides
            </h4>
            <div className="space-y-2">
              <button
                onClick={copyCampaignId}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-all text-left"
              >
                <Copy size={16} className="text-gray-400" />
                Copier l&apos;ID de la campagne
              </button>
            </div>
          </div>

          {/* Additional Data */}
          {campaign.data && Object.keys(campaign.data).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Données additionnelles
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(campaign.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
