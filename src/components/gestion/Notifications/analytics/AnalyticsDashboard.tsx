"use client";

import React, { useState, useMemo } from "react";
import { useMessagesQuery } from "@/hooks/useOnesignalQuery";
import type { OnesignalMessage } from "@/types/onesignal";
import {
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
  MousePointerClick,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Download,
  BarChart3,
} from "lucide-react";
import * as onesignalService from "@/services/onesignalService";
import { toast } from "react-hot-toast";

const COLORS = {
  primary: "#F17922",
  success: "#22c55e",
  info: "#3b82f6",
  warning: "#f59e0b",
  danger: "#ef4444",
  gray: "#9ca3af",
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.info, COLORS.warning, COLORS.danger];

export default function AnalyticsDashboard() {
  const [offset, setOffset] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Load recent messages for stats
  const { data: messagesData, isLoading } = useMessagesQuery({ limit: 50, offset });
  const messages = messagesData?.notifications ?? [];
  const totalMessages = messagesData?.total_count ?? 0;

  // ── Computed KPIs ──
  const kpis = useMemo(() => {
    if (!messages.length) {
      return { totalSent: 0, totalDelivered: 0, totalClicked: 0, totalFailed: 0, avgCtr: 0 };
    }

    let totalSent = 0;
    let totalDelivered = 0;
    let totalClicked = 0;
    let totalFailed = 0;
    let ctrSum = 0;
    let ctrCount = 0;

    messages.forEach((msg) => {
      const sent = msg.successful ?? 0;
      const clicked = msg.converted ?? 0;
      const failed = msg.failed ?? 0;

      totalSent += sent;
      totalDelivered += sent; // successful = delivered in OneSignal
      totalClicked += clicked;
      totalFailed += failed;

      if (sent > 0) {
        ctrSum += (clicked / sent) * 100;
        ctrCount++;
      }
    });

    return {
      totalSent,
      totalDelivered,
      totalClicked,
      totalFailed,
      avgCtr: ctrCount > 0 ? ctrSum / ctrCount : 0,
    };
  }, [messages]);

  // ── Chart data: Messages over time ──
  const timelineData = useMemo(() => {
    if (!messages.length) return [];

    const grouped: Record<string, { date: string; sent: number; clicked: number; failed: number }> = {};

    messages.forEach((msg) => {
      const ts = msg.completed_at ?? msg.queued_at ?? msg.send_after;
      if (!ts) return;
      const date = new Date(ts * 1000).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });

      if (!grouped[date]) {
        grouped[date] = { date, sent: 0, clicked: 0, failed: 0 };
      }
      grouped[date].sent += msg.successful ?? 0;
      grouped[date].clicked += msg.converted ?? 0;
      grouped[date].failed += msg.failed ?? 0;
    });

    return Object.values(grouped).reverse().slice(-14); // Last 14 data points
  }, [messages]);

  // ── Chart data: Channel distribution ──
  const channelData = useMemo(() => {
    if (!messages.length) return [];

    const channels: Record<string, number> = {};
    messages.forEach((msg) => {
      const channel = msg.isIos || msg.isAndroid ? "Push" : msg.target_channel === "email" ? "Email" : msg.target_channel === "sms" ? "SMS" : "Push";
      channels[channel] = (channels[channel] ?? 0) + 1;
    });

    return Object.entries(channels).map(([name, value]) => ({ name, value }));
  }, [messages]);

  // ── Export CSV ──
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await onesignalService.exportCsvPlayers();
      if (result?.csv_file_url) {
        toast.success("Export CSV en cours de g\u00e9n\u00e9ration. Le lien sera disponible sous peu.");
      } else {
        toast.success("Export demand\u00e9 avec succ\u00e8s");
      }
    } catch (err) {
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#F17922]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={<Send size={18} />}
          label="Total envoy\u00e9s"
          value={kpis.totalSent.toLocaleString()}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={<CheckCircle size={18} />}
          label="D\u00e9livr\u00e9s"
          value={kpis.totalDelivered.toLocaleString()}
          color="bg-green-50 text-green-600"
        />
        <KpiCard
          icon={<MousePointerClick size={18} />}
          label="CTR moyen"
          value={`${kpis.avgCtr.toFixed(1)}%`}
          color="bg-orange-50 text-[#F17922]"
        />
        <KpiCard
          icon={<AlertTriangle size={18} />}
          label="\u00c9checs"
          value={kpis.totalFailed.toLocaleString()}
          color="bg-red-50 text-red-500"
        />
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Bas\u00e9 sur les <span className="font-semibold text-gray-700">{messages.length}</span> derniers messages
          {totalMessages > 50 && (
            <span className="text-gray-400"> sur {totalMessages} au total</span>
          )}
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Download size={12} />
          )}
          Export CSV
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline chart */}
        <div className="lg:col-span-2 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Envois par jour</h3>
          </div>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={timelineData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
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
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f3f4f6",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="sent" name="Envoy\u00e9s" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" name="Cliqu\u00e9s" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="\u00c9checs" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-xs">
              Pas de donn\u00e9es disponibles
            </div>
          )}
        </div>

        {/* Channel distribution */}
        <div className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">R\u00e9partition par canal</h3>
          </div>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {channelData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f3f4f6",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-xs">
              Pas de donn\u00e9es disponibles
            </div>
          )}
        </div>
      </div>

      {/* Top messages table */}
      <div className="border border-gray-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Top messages par performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Message</th>
                <th className="pb-2 font-medium text-right">Envoy\u00e9s</th>
                <th className="pb-2 font-medium text-right">Cliqu\u00e9s</th>
                <th className="pb-2 font-medium text-right">CTR</th>
                <th className="pb-2 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...messages]
                .filter((m) => (m.successful ?? 0) > 0)
                .sort((a, b) => {
                  const ctrA = (a.successful ?? 0) > 0 ? ((a.converted ?? 0) / (a.successful ?? 1)) * 100 : 0;
                  const ctrB = (b.successful ?? 0) > 0 ? ((b.converted ?? 0) / (b.successful ?? 1)) * 100 : 0;
                  return ctrB - ctrA;
                })
                .slice(0, 10)
                .map((msg) => {
                  const sent = msg.successful ?? 0;
                  const clicked = msg.converted ?? 0;
                  const ctr = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : "0.0";
                  const ts = msg.completed_at ?? msg.queued_at;
                  const date = ts
                    ? new Date(ts * 1000).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "\u2014";

                  return (
                    <tr key={msg.id} className="hover:bg-gray-50/50">
                      <td className="py-2 max-w-[250px] truncate text-gray-700">
                        {msg.headings?.fr ?? msg.headings?.en ?? msg.name ?? "Sans titre"}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {sent.toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {clicked.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`font-medium ${
                            parseFloat(ctr) >= 5
                              ? "text-green-600"
                              : parseFloat(ctr) >= 2
                                ? "text-orange-500"
                                : "text-gray-400"
                          }`}
                        >
                          {ctr}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-400">{date}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
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
