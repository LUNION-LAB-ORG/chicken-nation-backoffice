"use client";

import React, { useState, useMemo } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  CalendarClock,
  Trophy,
  XCircle,
  Plus,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  Clock,
  Edit2,
  Trash2,
  Search,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserX,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CHART_COLORS,
  AXIS_STYLE,
  GRID_STYLE,
  AREA_GRADIENT_ID,
  AREA_GRADIENT_CONFIG,
} from "../../../../features/statistics/utils/chart-config";
import StatsCard from "./shared/StatsCard";
import StatsChartCard from "./shared/StatsChartCard";
import ChartTooltip, { PieChartTooltip } from "./shared/ChartTooltip";
import StatsTable from "./shared/StatsTable";
import StatsLoadingState from "./shared/StatsLoadingState";

import { useInactiveClientsQuery } from "../../../../features/statistics/queries/statistics-clients.query";
import type { InactiveClientItem } from "../../../../features/statistics/types/clients-stats.types";

import {
  useRetentionCallbackListQuery,
  useRetentionCallbackDueQuery,
} from "../../../../features/retention_callback/queries/retention-callback.query";
import {
  useRetentionOverviewQuery,
  useRetentionByReasonQuery,
  useRetentionAgentPerformanceQuery,
  useRetentionFunnelQuery,
  useRetentionTrendQuery,
} from "../../../../features/retention_callback/queries/retention-callback-stats.query";
import { useRetentionReasonsQuery } from "../../../../features/retention_callback/queries/retention-callback-reasons.query";
import {
  useCreateRetentionCallbackMutation,
  useUpdateRetentionCallbackMutation,
  useCreateReasonMutation,
  useUpdateReasonMutation,
  useDeleteReasonMutation,
} from "../../../../features/retention_callback/queries/retention-callback.mutations";
import type {
  IRetentionCallback,
  IRetentionCallbackReason,
  IRetentionCallbackFilters,
  ICreateRetentionCallbackDTO,
  RetentionCallbackStatus,
} from "../../../../features/retention_callback/types/retention-callback.types";

// === Status badge ===
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  CALLED: { label: "Appele", bg: "bg-blue-100", text: "text-blue-700" },
  NO_ANSWER: { label: "Pas de reponse", bg: "bg-gray-100", text: "text-gray-600" },
  CALLBACK_SCHEDULED: { label: "Rappel planifie", bg: "bg-yellow-100", text: "text-yellow-700" },
  RECONQUERED: { label: "Reconquis", bg: "bg-green-100", text: "text-green-700" },
  LOST: { label: "Perdu", bg: "bg-red-100", text: "text-red-600" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CALLED;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function getCustomerName(cb: IRetentionCallback) {
  const c = cb.customer;
  if (c.first_name || c.last_name) return `${c.first_name || ""} ${c.last_name || ""}`.trim();
  return c.phone || "Client inconnu";
}

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.pink,
  CHART_COLORS.warning,
  CHART_COLORS.secondary,
];

// ============================================================
// MAIN COMPONENT
// ============================================================

type TabKey = "clients_inactifs" | "dashboard" | "historique" | "rappels" | "raisons";

interface Props {
  initialCustomerId?: string;
}

export default function StatsRetentionCallbacks({ initialCustomerId }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialCustomerId ? "clients_inactifs" : "clients_inactifs");

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "clients_inactifs", label: "Clients inactifs", icon: UserX },
    { key: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { key: "historique", label: "Historique appels", icon: Phone },
    { key: "rappels", label: "Rappels du jour", icon: CalendarClock },
    { key: "raisons", label: "Raisons", icon: Settings },
  ];

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      {/* Header */}
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Retention Clients"
          subtitle="Suivi des appels de reconquete des anciens clients"
        />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 -mt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-[#F17922] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden min-h-[600px]">
        {activeTab === "clients_inactifs" && <InactiveClientsTab initialCustomerId={initialCustomerId} />}
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "historique" && <HistoriqueTab />}
        {activeTab === "rappels" && <RappelsTab />}
        {activeTab === "raisons" && <RaisonsTab />}
      </div>
    </div>
  );
}

// ============================================================
// TAB 1: CLIENTS INACTIFS (primary)
// ============================================================

function InactiveClientsTab({ initialCustomerId }: { initialCustomerId?: string }) {
  const [inactiveDays, setInactiveDays] = useState(30);
  const [search, setSearch] = useState("");
  const [actionModal, setActionModal] = useState<{ client: InactiveClientItem; status: string } | null>(null);
  const [formReasonId, setFormReasonId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formNextCallbackAt, setFormNextCallbackAt] = useState("");

  const { data: inactiveData, isLoading } = useInactiveClientsQuery({ inactiveDays, limit: 200 });
  const { data: reasons } = useRetentionReasonsQuery();
  const createMutation = useCreateRetentionCallbackMutation();

  const clients = useMemo(() => {
    const items = inactiveData?.items || [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (c) =>
        c.fullname?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [inactiveData, search]);

  const handleAction = (client: InactiveClientItem, status: string) => {
    if (status === "NO_ANSWER") {
      // Quick action - no modal needed
      createMutation.mutate({
        customer_id: client.id,
        status: "NO_ANSWER" as RetentionCallbackStatus,
        notes: "Pas de reponse",
      });
      return;
    }
    setActionModal({ client, status });
    setFormReasonId("");
    setFormNotes("");
    setFormNextCallbackAt("");
  };

  const submitAction = () => {
    if (!actionModal) return;
    const dto: ICreateRetentionCallbackDTO = {
      customer_id: actionModal.client.id,
      status: actionModal.status as RetentionCallbackStatus,
      reason_id: formReasonId || undefined,
      notes: formNotes || undefined,
      next_callback_at: formNextCallbackAt || undefined,
    };
    createMutation.mutate(dto, {
      onSuccess: () => setActionModal(null),
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, telephone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#F17922] focus:border-[#F17922] outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={inactiveDays}
              onChange={(e) => setInactiveDays(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#F17922]"
            >
              <option value={15}>15 jours</option>
              <option value={30}>30 jours</option>
              <option value={60}>60 jours</option>
              <option value={90}>90 jours</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{inactiveData?.totalCount || 0}</span> clients inactifs
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <StatsLoadingState />
      ) : clients.length === 0 ? (
        <div className="py-16 text-center">
          <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun client inactif trouve</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Telephone</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Derniere commande</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jours inactif</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commandes</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total depense</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-bold text-[#F17922]">
                        {(client.fullname || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.fullname}</p>
                        {client.email && <p className="text-xs text-gray-400">{client.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{client.phone || "\u2014"}</td>
                  <td className="py-3 px-3 text-gray-500">
                    {client.lastOrderDate
                      ? new Date(client.lastOrderDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                      : "\u2014"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      client.daysSinceLastOrder > 60 ? "bg-red-50 text-red-600" :
                      client.daysSinceLastOrder > 30 ? "bg-yellow-50 text-yellow-700" :
                      "bg-gray-50 text-gray-600"
                    }`}>
                      {client.daysSinceLastOrder}j
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600">{client.totalOrders}</td>
                  <td className="py-3 px-3 text-right font-medium text-gray-900">{client.totalSpent?.toLocaleString("fr-FR")} F</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleAction(client, "CALLED")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Marquer comme appele"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Appele
                      </button>
                      <button
                        onClick={() => handleAction(client, "NO_ANSWER")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Pas de reponse"
                      >
                        <PhoneOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAction(client, "CALLBACK_SCHEDULED")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                        title="Planifier un rappel"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {actionModal.status === "CALLED" ? "Enregistrer un appel" : "Planifier un rappel"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Client : <span className="font-medium text-gray-700">{actionModal.client.fullname}</span>
              {actionModal.client.phone && ` — ${actionModal.client.phone}`}
            </p>

            <div className="space-y-3">
              {/* Reason */}
              <div>
                <label className="text-xs font-medium text-gray-600">Raison du depart</label>
                <select
                  value={formReasonId}
                  onChange={(e) => setFormReasonId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#F17922]"
                >
                  <option value="">Selectionner une raison</option>
                  {(reasons || [])
                    .filter((r) => r.is_active)
                    .map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
              </div>

              {/* Next callback date */}
              {actionModal.status === "CALLBACK_SCHEDULED" && (
                <div>
                  <label className="text-xs font-medium text-gray-600">Date du rappel</label>
                  <input
                    type="datetime-local"
                    value={formNextCallbackAt}
                    onChange={(e) => setFormNextCallbackAt(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#F17922]"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-600">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Resume de l'appel..."
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#F17922] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={submitAction}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-[#F17922] text-white rounded-lg hover:bg-[#d96a1d] disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? "En cours..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 2: DASHBOARD
// ============================================================

function DashboardTab() {
  const { data: overview, isLoading: loadingOverview } = useRetentionOverviewQuery();
  const { data: byReason } = useRetentionByReasonQuery();
  const { data: agentPerf } = useRetentionAgentPerformanceQuery();
  const { data: funnel } = useRetentionFunnelQuery();
  const { data: trend } = useRetentionTrendQuery();

  if (loadingOverview) return <div className="p-4"><StatsLoadingState /></div>;

  const kpis = overview || { total: 0, called: 0, noAnswer: 0, scheduled: 0, reconquered: 0, lost: 0, reconquestRate: 0 };

  const pieData = (byReason || []).map((r, i) => ({
    name: r.reasonName,
    value: r.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const funnelData = funnel
    ? [
        { name: "Appeles", value: funnel.called, fill: CHART_COLORS.blue },
        { name: "Planifies", value: funnel.scheduled, fill: CHART_COLORS.warning },
        { name: "Reconquis", value: funnel.reconquered, fill: CHART_COLORS.success },
        { name: "Perdus", value: funnel.lost, fill: CHART_COLORS.danger },
      ]
    : [];

  return (
    <div className="p-4 space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard title="Total appels" value={kpis.total} color="blue" />
        <StatsCard title="Appeles" value={kpis.called} color="blue" />
        <StatsCard title="Pas de reponse" value={kpis.noAnswer} color="purple" />
        <StatsCard title="Rappels planifies" value={kpis.scheduled} color="orange" />
        <StatsCard title="Reconquis" value={kpis.reconquered} color="green" />
        <StatsCard title="Taux reconquete" value={`${kpis.reconquestRate}%`} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <StatsChartCard title="Repartition par raison" icon={BarChart3}>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </StatsChartCard>

        {/* Funnel */}
        <StatsChartCard title="Entonnoir de reconquete" icon={TrendingUp}>
          {funnelData.length > 0 ? (
            <div className="space-y-3 py-4">
              {funnelData.map((step, i) => {
                const maxVal = Math.max(...funnelData.map((d) => d.value), 1);
                const width = Math.max((step.value / maxVal) * 100, 8);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 text-right">{step.name}</span>
                    <div className="flex-1 relative h-8">
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${width}%`, backgroundColor: step.fill }}
                      >
                        <span className="text-xs font-bold text-white">{step.value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
          )}
        </StatsChartCard>
      </div>

      {/* Trend + Agent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatsChartCard title="Tendance quotidienne" icon={TrendingUp}>
          {(trend || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={AREA_GRADIENT_CONFIG.startColor} stopOpacity={AREA_GRADIENT_CONFIG.startOpacity} />
                    <stop offset="95%" stopColor={AREA_GRADIENT_CONFIG.endColor} stopOpacity={AREA_GRADIENT_CONFIG.endOpacity} />
                  </linearGradient>
                  <linearGradient id="colorReconquered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis dataKey="date" tick={AXIS_STYLE} tickFormatter={formatShortDate} />
                <YAxis tick={AXIS_STYLE} />
                <Tooltip content={<ChartTooltip labelFormatter={formatShortDate} />} />
                <Area type="monotone" dataKey="total" name="Total" stroke={CHART_COLORS.primary} fill={`url(#${AREA_GRADIENT_ID})`} strokeWidth={2} />
                <Area type="monotone" dataKey="reconquered" name="Reconquis" stroke={CHART_COLORS.success} fill="url(#colorReconquered)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
          )}
        </StatsChartCard>

        <StatsChartCard title="Performance agents" icon={Users}>
          <StatsTable
            columns={[
              { key: "agent", label: "Agent" },
              { key: "calls", label: "Appels", align: "right" },
              { key: "reconquered", label: "Reconquis", align: "right" },
              { key: "rate", label: "Taux", align: "right" },
            ]}
            rows={(agentPerf || []).map((a) => ({
              agent: (
                <div className="flex items-center gap-2">
                  {a.image ? (
                    <img src={a.image} className="w-6 h-6 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-[#F17922]">
                      {(a.fullname || "?")[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{a.fullname}</span>
                </div>
              ),
              calls: <span className="text-sm font-medium">{a.totalCalls}</span>,
              reconquered: <span className="text-sm font-medium text-green-600">{a.reconquered}</span>,
              rate: (
                <span className={`text-sm font-bold ${a.reconquestRate >= 30 ? "text-green-600" : a.reconquestRate >= 15 ? "text-yellow-600" : "text-red-500"}`}>
                  {a.reconquestRate}%
                </span>
              ),
            }))}
            emptyMessage="Aucune donnee agent"
          />
        </StatsChartCard>
      </div>
    </div>
  );
}

// ============================================================
// TAB 3: HISTORIQUE DES APPELS
// ============================================================

function HistoriqueTab() {
  const [filters, setFilters] = useState<IRetentionCallbackFilters>({ page: 1, limit: 20 });
  const [searchQuery, setSearchQuery] = useState("");
  const { data: listData, isLoading } = useRetentionCallbackListQuery(filters);
  const updateMutation = useUpdateRetentionCallbackMutation();

  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery, page: 1 });
  };

  const callbacks = listData?.data || [];
  const meta = listData?.meta;

  return (
    <div className="p-4 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher client, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#F17922] focus:border-[#F17922] outline-none"
            />
          </div>
          <select
            value={filters.status?.[0] || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value ? [e.target.value as RetentionCallbackStatus] : undefined,
                page: 1,
              })
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#F17922]"
          >
            <option value="">Tous statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <StatsLoadingState />
      ) : (
        <>
          <StatsTable
            columns={[
              { key: "client", label: "Client" },
              { key: "reason", label: "Raison" },
              { key: "agent", label: "Agent" },
              { key: "status", label: "Statut" },
              { key: "calledAt", label: "Date appel" },
              { key: "nextCallback", label: "Prochain rappel" },
              { key: "notes", label: "Notes" },
              { key: "actions", label: "", align: "right" },
            ]}
            rows={callbacks.map((cb) => ({
              client: (
                <div>
                  <span className="text-sm font-medium text-gray-900">{getCustomerName(cb)}</span>
                  {cb.customer.phone && <p className="text-xs text-gray-400">{cb.customer.phone}</p>}
                </div>
              ),
              reason: <span className="text-xs text-gray-600">{cb.reason?.name || "\u2014"}</span>,
              agent: <span className="text-xs text-gray-600">{cb.caller.fullname || "\u2014"}</span>,
              status: <StatusBadge status={cb.status} />,
              calledAt: <span className="text-xs text-gray-500">{formatDate(cb.called_at)}</span>,
              nextCallback: <span className="text-xs text-gray-500">{formatDate(cb.next_callback_at)}</span>,
              notes: <span className="text-xs text-gray-500 max-w-[200px] truncate block">{cb.notes || "\u2014"}</span>,
              actions: (
                <div className="flex items-center gap-1">
                  {(cb.status === "CALLED" || cb.status === "CALLBACK_SCHEDULED") && (
                    <>
                      <button
                        onClick={() => updateMutation.mutate({ id: cb.id, data: { status: "RECONQUERED" as RetentionCallbackStatus } })}
                        className="p-1 rounded hover:bg-green-50 text-green-600"
                        title="Marquer reconquis"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateMutation.mutate({ id: cb.id, data: { status: "LOST" as RetentionCallbackStatus } })}
                        className="p-1 rounded hover:bg-red-50 text-red-500"
                        title="Marquer perdu"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ),
            }))}
            emptyMessage="Aucun appel enregistre"
          />

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-gray-500">
                {meta.total} resultat{meta.total > 1 ? "s" : ""} — Page {meta.page}/{meta.totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Precedent
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= meta.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Suivant
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// TAB 4: RAPPELS DU JOUR
// ============================================================

function RappelsTab() {
  const { data: dueCallbacks, isLoading } = useRetentionCallbackDueQuery();
  const updateMutation = useUpdateRetentionCallbackMutation();

  if (isLoading) return <div className="p-4"><StatsLoadingState /></div>;

  const callbacks = dueCallbacks || [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#F17922]" />
        <span className="text-sm font-semibold text-gray-900">
          {callbacks.length} rappel{callbacks.length > 1 ? "s" : ""} a traiter
        </span>
      </div>

      {callbacks.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun rappel planifie pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {callbacks.map((cb) => (
            <div key={cb.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{getCustomerName(cb)}</p>
                  <p className="text-xs text-gray-500">
                    {cb.customer.phone} — {cb.reason?.name || "Raison non specifiee"}
                  </p>
                  {cb.notes && <p className="text-xs text-gray-400 mt-0.5 max-w-md truncate">{cb.notes}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Prevu: {formatDate(cb.next_callback_at)}</span>
                <button
                  onClick={() => updateMutation.mutate({ id: cb.id, data: { status: "CALLED" as RetentionCallbackStatus } })}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <PhoneCall className="w-3 h-3" />
                  Appele
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    updateMutation.mutate({ id: cb.id, data: { next_callback_at: tomorrow.toISOString() } });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <CalendarClock className="w-3 h-3" />
                  Reporter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 5: RAISONS (CRUD)
// ============================================================

function RaisonsTab() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IRetentionCallbackReason | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: reasons, isLoading } = useRetentionReasonsQuery();
  const createMutation = useCreateReasonMutation();
  const updateMutation = useUpdateReasonMutation();
  const deleteMutation = useDeleteReasonMutation();

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name, description } },
        { onSuccess: () => closeModal() }
      );
    } else {
      createMutation.mutate(
        { name, description },
        { onSuccess: () => closeModal() }
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setName("");
    setDescription("");
  };

  const handleEdit = (reason: IRetentionCallbackReason) => {
    setEditing(reason);
    setName(reason.name);
    setDescription(reason.description || "");
    setShowModal(true);
  };

  const handleToggleActive = (reason: IRetentionCallbackReason) => {
    updateMutation.mutate({ id: reason.id, data: { is_active: !reason.is_active } });
  };

  if (isLoading) return <div className="p-4"><StatsLoadingState /></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Raisons d&apos;abandon</span>
        <button
          onClick={() => { setEditing(null); setName(""); setDescription(""); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F17922] text-white text-sm font-medium rounded-lg hover:bg-[#d96a1d] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle raison
        </button>
      </div>

      {(reasons || []).length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">Aucune raison configuree</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {(reasons || []).map((reason) => (
            <div key={reason.id} className="flex items-center justify-between px-2 py-3 hover:bg-gray-50 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{reason.name}</span>
                  {reason.description && <p className="text-xs text-gray-400">{reason.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(reason)}
                  className={`px-2 py-0.5 text-xs rounded-full ${reason.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {reason.is_active ? "Actif" : "Inactif"}
                </button>
                <button onClick={() => handleEdit(reason)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm("Supprimer cette raison ?")) deleteMutation.mutate(reason.id); }}
                  className="p-1 rounded hover:bg-red-50 text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reason Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              {editing ? "Modifier la raison" : "Nouvelle raison"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Nom</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Rapport qualite prix"
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#F17922]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#F17922] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600">Annuler</button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-[#F17922] text-white rounded-lg hover:bg-[#d96a1d] disabled:opacity-50"
              >
                {editing ? "Modifier" : "Creer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
