"use client";

import React, { useMemo } from "react";
import { useCampaignStatsQuery } from "@/hooks/usePushCampaignQuery";
import {
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BarChart3,
  Hash,
} from "lucide-react";

const COLORS = {
  primary: "#F17922",
  success: "#22c55e",
  danger: "#ef4444",
};

export default function AnalyticsDashboard() {
  const { data: stats, isLoading } = useCampaignStatsQuery();

  const deliveryRate = useMemo(() => {
    if (!stats || stats.totalSent === 0) return "0.0";
    const rate = ((stats.totalSent - stats.totalFailed) / stats.totalSent) * 100;
    return rate.toFixed(1);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#F17922]" size={32} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={<Hash size={18} />}
          label="Campagnes"
          value={stats.totalCampaigns.toLocaleString("fr-FR")}
          color="bg-purple-50 text-purple-600"
        />
        <KpiCard
          icon={<Send size={18} />}
          label="Total envoyés"
          value={stats.totalSent.toLocaleString("fr-FR")}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={<CheckCircle size={18} />}
          label="Taux de livraison"
          value={`${deliveryRate}%`}
          color="bg-green-50 text-green-600"
        />
        <KpiCard
          icon={<AlertTriangle size={18} />}
          label="Échecs"
          value={stats.totalFailed.toLocaleString("fr-FR")}
          color="bg-red-50 text-red-500"
        />
      </div>

      {/* Recent Campaigns Table */}
      {stats.recentCampaigns.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Dernières campagnes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Campagne</th>
                  <th className="pb-2 font-medium text-center">Statut</th>
                  <th className="pb-2 font-medium text-right">Ciblés</th>
                  <th className="pb-2 font-medium text-right">Envoyés</th>
                  <th className="pb-2 font-medium text-right">Échecs</th>
                  <th className="pb-2 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentCampaigns.map((campaign) => {
                  const date = campaign.sent_at ?? campaign.created_at;
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 max-w-[200px] truncate text-gray-700 font-medium">
                        {campaign.name}
                      </td>
                      <td className="py-2.5 text-center">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="py-2.5 text-right text-gray-600">
                        {campaign.total_targeted.toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2.5 text-right text-gray-600">
                        {campaign.total_sent.toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={
                            campaign.total_failed > 0
                              ? "text-red-500 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {campaign.total_failed.toLocaleString("fr-FR")}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-gray-400">
                        {date
                          ? new Intl.DateTimeFormat("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(date))
                          : "\u2014"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Card component ──
function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: "bg-green-100 text-green-700",
    draft: "bg-gray-100 text-gray-600",
    scheduled: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    sent: "Envoyé",
    draft: "Brouillon",
    scheduled: "Planifié",
    failed: "Échoué",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        styles[status] ?? styles.draft
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
