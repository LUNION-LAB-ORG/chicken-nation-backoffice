"use client";

import React, { useState, useMemo } from "react";
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
  ChevronRight,
  Search,
  GripVertical,
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
  BarChart,
  Bar,
  LabelList,
  FunnelChart,
  Funnel,
} from "recharts";
import {
  CHART_COLORS,
  AXIS_STYLE,
  GRID_STYLE,
  AREA_GRADIENT_ID,
  AREA_GRADIENT_CONFIG,
  MULTI_SERIES_COLORS,
} from "../../../../features/statistics/utils/chart-config";
import StatsCard from "./shared/StatsCard";
import StatsChartCard from "./shared/StatsChartCard";
import ChartTooltip, { PieChartTooltip } from "./shared/ChartTooltip";
import StatsTable from "./shared/StatsTable";
import StatsLoadingState from "./shared/StatsLoadingState";

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
  useDeleteRetentionCallbackMutation,
  useCreateReasonMutation,
  useUpdateReasonMutation,
  useDeleteReasonMutation,
  useReorderReasonsMutation,
} from "../../../../features/retention_callback/queries/retention-callback.mutations";
import type {
  IRetentionCallback,
  IRetentionCallbackReason,
  IRetentionCallbackFilters,
  ICreateRetentionCallbackDTO,
  RetentionCallbackStatus,
} from "../../../../features/retention_callback/types/retention-callback.types";

// === Status badge colors ===
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  CALLED: { label: "Appelé", bg: "bg-blue-100", text: "text-blue-700" },
  NO_ANSWER: {
    label: "Pas de réponse",
    bg: "bg-gray-100",
    text: "text-gray-600",
  },
  CALLBACK_SCHEDULED: {
    label: "Rappel planifié",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
  RECONQUERED: {
    label: "Reconquis",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  LOST: { label: "Perdu", bg: "bg-red-100", text: "text-red-600" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CALLED;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function getCustomerName(cb: IRetentionCallback) {
  const c = cb.customer;
  if (c.first_name || c.last_name) return `${c.first_name || ""} ${c.last_name || ""}`.trim();
  return c.phone || "Client inconnu";
}

// === PIE CHART COLORS ===
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

type TabKey = "dashboard" | "appels" | "rappels" | "raisons";

interface Props {
  initialCustomerId?: string;
}

export default function StatsRetentionCallbacks({ initialCustomerId }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [filters, setFilters] = useState<IRetentionCallbackFilters>({
    page: 1,
    limit: 20,
    customer_id: initialCustomerId,
  });
  const [showCreateModal, setShowCreateModal] = useState(!!initialCustomerId);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formCustomerId, setFormCustomerId] = useState(initialCustomerId || "");
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formReasonId, setFormReasonId] = useState("");
  const [formStatus, setFormStatus] = useState<string>("CALLED");
  const [formNotes, setFormNotes] = useState("");
  const [formNextCallbackAt, setFormNextCallbackAt] = useState("");

  // Reason form state
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [editingReason, setEditingReason] = useState<IRetentionCallbackReason | null>(null);
  const [reasonName, setReasonName] = useState("");
  const [reasonDescription, setReasonDescription] = useState("");

  const tabs = [
    { key: "dashboard" as TabKey, label: "Tableau de bord", icon: BarChart3 },
    { key: "appels" as TabKey, label: "Appels", icon: Phone },
    { key: "rappels" as TabKey, label: "Rappels du jour", icon: CalendarClock },
    { key: "raisons" as TabKey, label: "Raisons", icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Rétention Clients
          </h2>
          <p className="text-xs text-gray-500">
            Suivi des appels de reconquête des anciens clients
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-[#F17922] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "appels" && (
        <AppelsTab
          filters={filters}
          setFilters={setFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          formCustomerId={formCustomerId}
          setFormCustomerId={setFormCustomerId}
          formCustomerPhone={formCustomerPhone}
          setFormCustomerPhone={setFormCustomerPhone}
          formReasonId={formReasonId}
          setFormReasonId={setFormReasonId}
          formStatus={formStatus}
          setFormStatus={setFormStatus}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          formNextCallbackAt={formNextCallbackAt}
          setFormNextCallbackAt={setFormNextCallbackAt}
        />
      )}
      {activeTab === "rappels" && <RappelsTab />}
      {activeTab === "raisons" && (
        <RaisonsTab
          showReasonModal={showReasonModal}
          setShowReasonModal={setShowReasonModal}
          editingReason={editingReason}
          setEditingReason={setEditingReason}
          reasonName={reasonName}
          setReasonName={setReasonName}
          reasonDescription={reasonDescription}
          setReasonDescription={setReasonDescription}
        />
      )}
    </div>
  );
}

// ============================================================
// TAB 1: DASHBOARD
// ============================================================

function DashboardTab() {
  const { data: overview, isLoading: loadingOverview } = useRetentionOverviewQuery();
  const { data: byReason, isLoading: loadingReason } = useRetentionByReasonQuery();
  const { data: agentPerf, isLoading: loadingAgent } = useRetentionAgentPerformanceQuery();
  const { data: funnel, isLoading: loadingFunnel } = useRetentionFunnelQuery();
  const { data: trend, isLoading: loadingTrend } = useRetentionTrendQuery();

  if (loadingOverview) return <StatsLoadingState />;

  const kpis = overview || { total: 0, called: 0, noAnswer: 0, scheduled: 0, reconquered: 0, lost: 0, reconquestRate: 0 };

  const pieData = (byReason || []).map((r, i) => ({
    name: r.reasonName,
    value: r.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const funnelData = funnel
    ? [
        { name: "Appelés", value: funnel.called, fill: CHART_COLORS.blue },
        { name: "Planifiés", value: funnel.scheduled, fill: CHART_COLORS.warning },
        { name: "Reconquis", value: funnel.reconquered, fill: CHART_COLORS.success },
        { name: "Perdus", value: funnel.lost, fill: CHART_COLORS.danger },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard title="Total appels" value={kpis.total} color="blue" />
        <StatsCard title="Appelés" value={kpis.called} color="blue" />
        <StatsCard title="Pas de réponse" value={kpis.noAnswer} color="purple" />
        <StatsCard title="Rappels planifiés" value={kpis.scheduled} color="orange" />
        <StatsCard title="Reconquis" value={kpis.reconquered} color="green" />
        <StatsCard
          title="Taux reconquête"
          value={`${kpis.reconquestRate}%`}
          color="green"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart - Raisons */}
        <StatsChartCard title="Répartition par raison" icon={BarChart3}>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée
            </div>
          )}
          {/* Legend */}
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
        <StatsChartCard title="Entonnoir de reconquête" icon={TrendingUp}>
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
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée
            </div>
          )}
        </StatsChartCard>
      </div>

      {/* Trend + Agent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Chart */}
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
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke={CHART_COLORS.primary}
                  fill={`url(#${AREA_GRADIENT_ID})`}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="reconquered"
                  name="Reconquis"
                  stroke={CHART_COLORS.success}
                  fill="url(#colorReconquered)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée
            </div>
          )}
        </StatsChartCard>

        {/* Agent Performance */}
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
              reconquered: (
                <span className="text-sm font-medium text-green-600">{a.reconquered}</span>
              ),
              rate: (
                <span
                  className={`text-sm font-bold ${
                    a.reconquestRate >= 30 ? "text-green-600" : a.reconquestRate >= 15 ? "text-yellow-600" : "text-red-500"
                  }`}
                >
                  {a.reconquestRate}%
                </span>
              ),
            }))}
            emptyMessage="Aucune donnée agent"
          />
        </StatsChartCard>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2: APPELS
// ============================================================

interface AppelsTabProps {
  filters: IRetentionCallbackFilters;
  setFilters: (f: IRetentionCallbackFilters) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  formCustomerId: string;
  setFormCustomerId: (v: string) => void;
  formCustomerPhone: string;
  setFormCustomerPhone: (v: string) => void;
  formReasonId: string;
  setFormReasonId: (v: string) => void;
  formStatus: string;
  setFormStatus: (v: string) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  formNextCallbackAt: string;
  setFormNextCallbackAt: (v: string) => void;
}

function AppelsTab({
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  showCreateModal,
  setShowCreateModal,
  formCustomerId,
  setFormCustomerId,
  formCustomerPhone,
  setFormCustomerPhone,
  formReasonId,
  setFormReasonId,
  formStatus,
  setFormStatus,
  formNotes,
  setFormNotes,
  formNextCallbackAt,
  setFormNextCallbackAt,
}: AppelsTabProps) {
  const { data: reasons } = useRetentionReasonsQuery();
  const { data: listData, isLoading } = useRetentionCallbackListQuery(filters);
  const createMutation = useCreateRetentionCallbackMutation();
  const updateMutation = useUpdateRetentionCallbackMutation();

  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery, page: 1 });
  };

  const handleCreate = () => {
    if (!formCustomerId) return;
    const dto: ICreateRetentionCallbackDTO = {
      customer_id: formCustomerId,
      reason_id: formReasonId || undefined,
      status: formStatus as RetentionCallbackStatus,
      notes: formNotes || undefined,
      next_callback_at: formNextCallbackAt || undefined,
    };
    createMutation.mutate(dto, {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setFormCustomerId("");
    setFormCustomerPhone("");
    setFormReasonId("");
    setFormStatus("CALLED");
    setFormNotes("");
    setFormNextCallbackAt("");
  };

  const callbacks = listData?.data || [];
  const meta = listData?.meta;

  // Search customer by phone
  const handlePhoneSearch = async () => {
    if (!formCustomerPhone) return;
    try {
      const { apiRequest } = await import("@/services/api");
      const result = await apiRequest<{ data: Array<{ id: string; first_name?: string; last_name?: string; phone: string }> }>(
        `/customers?search=${encodeURIComponent(formCustomerPhone)}&limit=1`
      );
      if (result.data?.[0]) {
        setFormCustomerId(result.data[0].id);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher client, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#F17922] focus:border-[#F17922] outline-none"
            />
          </div>
          {/* Status filter */}
          <select
            value={filters.status?.[0] || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value ? [e.target.value as RetentionCallbackStatus] : undefined,
                page: 1,
              })
            }
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#F17922]"
          >
            <option value="">Tous statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F17922] text-white text-xs font-medium rounded-lg hover:bg-[#d96a1d] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvel appel
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <StatsLoadingState />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                    {cb.customer.phone && (
                      <p className="text-xs text-gray-400">{cb.customer.phone}</p>
                    )}
                  </div>
                ),
                reason: (
                  <span className="text-xs text-gray-600">{cb.reason?.name || "—"}</span>
                ),
                agent: (
                  <span className="text-xs text-gray-600">{cb.caller.fullname || "—"}</span>
                ),
                status: <StatusBadge status={cb.status} />,
                calledAt: <span className="text-xs text-gray-500">{formatDate(cb.called_at)}</span>,
                nextCallback: (
                  <span className="text-xs text-gray-500">{formatDate(cb.next_callback_at)}</span>
                ),
                notes: (
                  <span className="text-xs text-gray-500 max-w-[200px] truncate block">
                    {cb.notes || "—"}
                  </span>
                ),
                actions: (
                  <div className="flex items-center gap-1">
                    {(cb.status === "CALLED" || cb.status === "CALLBACK_SCHEDULED") && (
                      <>
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: cb.id,
                              data: { status: "RECONQUERED" as RetentionCallbackStatus },
                            })
                          }
                          className="p-1 rounded hover:bg-green-50 text-green-600"
                          title="Marquer reconquis"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: cb.id,
                              data: { status: "LOST" as RetentionCallbackStatus },
                            })
                          }
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
              emptyMessage="Aucun appel enregistré"
            />
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {meta.total} résultat{meta.total > 1 ? "s" : ""} — Page {meta.page}/{meta.totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= meta.totalPages}
                  className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Nouvel appel de rétention</h3>

            <div className="space-y-3">
              {/* Phone search */}
              <div>
                <label className="text-xs font-medium text-gray-600">Téléphone du client</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="+229..."
                    value={formCustomerPhone}
                    onChange={(e) => setFormCustomerPhone(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-[#F17922]"
                  />
                  <button
                    onClick={handlePhoneSearch}
                    className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Chercher
                  </button>
                </div>
                {formCustomerId && (
                  <p className="text-xs text-green-600 mt-1">Client trouvé: {formCustomerId.slice(0, 8)}...</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-medium text-gray-600">Raison</label>
                <select
                  value={formReasonId}
                  onChange={(e) => setFormReasonId(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-[#F17922]"
                >
                  <option value="">Sélectionner une raison</option>
                  {(reasons || [])
                    .filter((r) => r.is_active)
                    .map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-gray-600">Statut</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {(["CALLED", "NO_ANSWER", "CALLBACK_SCHEDULED"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormStatus(s)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        formStatus === s
                          ? "bg-[#F17922] text-white border-[#F17922]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next callback */}
              {formStatus === "CALLBACK_SCHEDULED" && (
                <div>
                  <label className="text-xs font-medium text-gray-600">Date du prochain rappel</label>
                  <input
                    type="datetime-local"
                    value={formNextCallbackAt}
                    onChange={(e) => setFormNextCallbackAt(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-[#F17922]"
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
                  placeholder="Résumé de l'appel..."
                  className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-[#F17922] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!formCustomerId || createMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium bg-[#F17922] text-white rounded-lg hover:bg-[#d96a1d] disabled:opacity-50"
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
// TAB 3: RAPPELS DU JOUR
// ============================================================

function RappelsTab() {
  const { data: dueCallbacks, isLoading } = useRetentionCallbackDueQuery();
  const updateMutation = useUpdateRetentionCallbackMutation();

  if (isLoading) return <StatsLoadingState />;

  const callbacks = dueCallbacks || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#F17922]" />
        <span className="text-sm font-semibold text-gray-900">
          {callbacks.length} rappel{callbacks.length > 1 ? "s" : ""} à traiter
        </span>
      </div>

      {callbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <CalendarClock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucun rappel planifié pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {callbacks.map((cb) => (
            <div
              key={cb.id}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{getCustomerName(cb)}</p>
                  <p className="text-xs text-gray-500">
                    {cb.customer.phone} — {cb.reason?.name || "Raison non spécifiée"}
                  </p>
                  {cb.notes && (
                    <p className="text-xs text-gray-400 mt-0.5 max-w-md truncate">{cb.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Prévu: {formatDate(cb.next_callback_at)}
                </span>
                <button
                  onClick={() =>
                    updateMutation.mutate({ id: cb.id, data: { status: "CALLED" as RetentionCallbackStatus } })
                  }
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <PhoneCall className="w-3 h-3" />
                  Appelé
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    updateMutation.mutate({
                      id: cb.id,
                      data: { next_callback_at: tomorrow.toISOString() },
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
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
// TAB 4: RAISONS (CRUD)
// ============================================================

interface RaisonsTabProps {
  showReasonModal: boolean;
  setShowReasonModal: (v: boolean) => void;
  editingReason: IRetentionCallbackReason | null;
  setEditingReason: (r: IRetentionCallbackReason | null) => void;
  reasonName: string;
  setReasonName: (v: string) => void;
  reasonDescription: string;
  setReasonDescription: (v: string) => void;
}

function RaisonsTab({
  showReasonModal,
  setShowReasonModal,
  editingReason,
  setEditingReason,
  reasonName,
  setReasonName,
  reasonDescription,
  setReasonDescription,
}: RaisonsTabProps) {
  const { data: reasons, isLoading } = useRetentionReasonsQuery();
  const createMutation = useCreateReasonMutation();
  const updateMutation = useUpdateReasonMutation();
  const deleteMutation = useDeleteReasonMutation();
  const reorderMutation = useReorderReasonsMutation();

  const handleSave = () => {
    if (!reasonName.trim()) return;
    if (editingReason) {
      updateMutation.mutate(
        { id: editingReason.id, data: { name: reasonName, description: reasonDescription } },
        { onSuccess: () => closeModal() }
      );
    } else {
      createMutation.mutate(
        { name: reasonName, description: reasonDescription },
        { onSuccess: () => closeModal() }
      );
    }
  };

  const closeModal = () => {
    setShowReasonModal(false);
    setEditingReason(null);
    setReasonName("");
    setReasonDescription("");
  };

  const handleEdit = (reason: IRetentionCallbackReason) => {
    setEditingReason(reason);
    setReasonName(reason.name);
    setReasonDescription(reason.description || "");
    setShowReasonModal(true);
  };

  const handleToggleActive = (reason: IRetentionCallbackReason) => {
    updateMutation.mutate({ id: reason.id, data: { is_active: !reason.is_active } });
  };

  if (isLoading) return <StatsLoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Raisons d&apos;abandon</span>
        <button
          onClick={() => {
            setEditingReason(null);
            setReasonName("");
            setReasonDescription("");
            setShowReasonModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F17922] text-white text-xs font-medium rounded-lg hover:bg-[#d96a1d]"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvelle raison
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {(reasons || []).length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Aucune raison configurée
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(reasons || []).map((reason) => (
              <div
                key={reason.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{reason.name}</span>
                    {reason.description && (
                      <p className="text-xs text-gray-400">{reason.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleActive(reason)}
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      reason.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {reason.is_active ? "Actif" : "Inactif"}
                  </button>
                  <button
                    onClick={() => handleEdit(reason)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer cette raison ?")) {
                        deleteMutation.mutate(reason.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              {editingReason ? "Modifier la raison" : "Nouvelle raison"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Nom</label>
                <input
                  type="text"
                  value={reasonName}
                  onChange={(e) => setReasonName(e.target.value)}
                  placeholder="Ex: Rapport qualité prix"
                  className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-[#F17922]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Description</label>
                <textarea
                  value={reasonDescription}
                  onChange={(e) => setReasonDescription(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-[#F17922] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeModal} className="px-3 py-1.5 text-xs text-gray-600">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!reasonName.trim() || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium bg-[#F17922] text-white rounded-lg hover:bg-[#d96a1d] disabled:opacity-50"
              >
                {editingReason ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
