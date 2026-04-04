"use client";

import React, { useState, useMemo } from "react";
import { useCampaignStatsQuery, useCampaignChartQuery } from "@/hooks/usePushCampaignQuery";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BarChart3,
  Hash,
  TrendingUp,
  Calendar,
} from "lucide-react";

const COLORS = {
  primary: "#F17922",
  sent: "#3b82f6",
  failed: "#ef4444",
  targeted: "#8b5cf6",
  success: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  sent: "#22c55e",
  failed: "#ef4444",
  scheduled: "#f59e0b",
  draft: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Envoyé",
  failed: "Échoué",
  scheduled: "Planifié",
  draft: "Brouillon",
};

const PERIOD_OPTIONS = [
  { value: 7, label: "7 jours" },
  { value: 14, label: "14 jours" },
  { value: 30, label: "30 jours" },
];

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState(30);
  const { data: stats, isLoading: statsLoading } = useCampaignStatsQuery();
  const { data: chartData, isLoading: chartLoading } = useCampaignChartQuery(period);

  const deliveryRate = useMemo(() => {
    if (!stats || stats.totalSent === 0) return "0.0";
    const rate = ((stats.totalSent - stats.totalFailed) / stats.totalSent) * 100;
    return rate.toFixed(1);
  }, [stats]);

  const isLoading = statsLoading || chartLoading;

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

  const daily = chartData?.daily ?? [];
  const statusDistribution = chartData?.statusDistribution ?? [];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Période</span>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                period === opt.value
                  ? "bg-white text-[#F17922] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Sent over time */}
        <div className="lg:col-span-2 border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications envoyées
            </h3>
          </div>
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradientSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.sent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.sent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.failed} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.failed} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-xs">
                        <p className="font-medium text-gray-900 mb-1.5">{formatShortDate(label)}</p>
                        {payload.map((p: any) => (
                          <div key={p.dataKey} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-gray-600">
                              {p.dataKey === "sent" ? "Envoyés" : p.dataKey === "failed" ? "Échecs" : "Ciblés"}:
                            </span>
                            <span className="font-semibold text-gray-900">{p.value?.toLocaleString("fr-FR")}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke={COLORS.sent}
                  strokeWidth={2}
                  fill="url(#gradientSent)"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke={COLORS.failed}
                  strokeWidth={2}
                  fill="url(#gradientFailed)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              Aucune donnée pour cette période
            </div>
          )}
        </div>

        {/* Pie: Status Distribution */}
        <div className="border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Répartition des statuts
            </h3>
          </div>
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {statusDistribution.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "#9ca3af"}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">
                      {STATUS_LABELS[value] ?? value}
                    </span>
                  )}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-xs">
                        <p className="font-medium text-gray-900">
                          {STATUS_LABELS[d.name as string] ?? d.name}: {(d.value as number)?.toLocaleString("fr-FR")}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart: Campaigns per day */}
      {daily.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Campagnes par jour
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-xs">
                      <p className="font-medium text-gray-900 mb-1">{formatShortDate(label)}</p>
                      <p className="text-gray-600">
                        Campagnes: <span className="font-semibold text-gray-900">{payload[0]?.value}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="campaigns" fill={COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Campaigns Table */}
      {stats.recentCampaigns.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-5">
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
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
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

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        styles[status] ?? styles.draft
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
