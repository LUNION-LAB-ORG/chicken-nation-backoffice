"use client";

import React, { useMemo, useState } from "react";
import {
  BadgePercent,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  DollarSign,
  Pencil,
  Percent,
  Phone,
  Receipt,
  Repeat,
  ShoppingBag,
  Tag,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import {
  usePromoCodeAnalyticsQuery,
  usePromoCodeQuery,
  usePromoCodeUsagesQuery,
} from "../../../../features/promo_code/queries/promo-code.queries";
import { useTogglePromoCodeMutation } from "../../../../features/promo_code/queries/promo-code.mutations";
import type {
  PromoCode,
  PromoCodeAnalyticsDay,
} from "../../../../features/promo_code/types/promo-code.types";

// --- Helpers ---

const formatFCFA = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "-";
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
};

const formatRelative = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return formatDate(dateStr);
};

const getPromoStatus = (promo: PromoCode): "active" | "inactive" | "expired" => {
  if (new Date(promo.expiration_date) < new Date()) return "expired";
  return promo.is_active ? "active" : "inactive";
};

const statusConfig = {
  active: { label: "Actif", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  inactive: { label: "Inactif", className: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  expired: { label: "Expiré", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
} as const;

const WEEKDAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
/** Ordre d'affichage : Lundi → Dimanche */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  IN_PROGRESS: "En préparation",
  READY: "Prête",
  PICKED_UP: "Récupérée",
  COLLECTED: "Récupérée",
  COMPLETED: "Terminée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const customerName = (c?: { first_name?: string | null; last_name?: string | null } | null) => {
  const name = `${c?.first_name ?? ""} ${c?.last_name ?? ""}`.trim();
  return name || "Client";
};

const initials = (c?: { first_name?: string | null; last_name?: string | null } | null) => {
  const a = (c?.first_name ?? "").charAt(0);
  const b = (c?.last_name ?? "").charAt(0);
  return (a + b).toUpperCase() || "C";
};

/** Comble les jours sans utilisation entre la 1re et la dernière (max 92 jours). */
const fillMissingDays = (days: PromoCodeAnalyticsDay[]): PromoCodeAnalyticsDay[] => {
  if (days.length < 2) return days;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(`${sorted[0].date}T00:00:00Z`);
  const end = new Date(`${sorted[sorted.length - 1].date}T00:00:00Z`);
  const span = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (span > 92) return sorted;

  const byDate = new Map(sorted.map((d) => [d.date, d]));
  const filled: PromoCodeAnalyticsDay[] = [];
  for (let i = 0; i <= span; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    filled.push(byDate.get(key) ?? { date: key, usages: 0, discount: 0 });
  }
  return filled;
};

const chartTooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  fontSize: 12,
};

// --- Sous-composants ---

function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 truncate">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400 truncate">{sub}</p>}
        </div>
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} />;
}

// --- Composant principal ---

interface PromoCodeDetailProps {
  promo: PromoCode;
  onBack: () => void;
  onEdit: (promo: PromoCode) => void;
}

export default function PromoCodeDetail({ promo, onBack, onEdit }: PromoCodeDetailProps) {
  const [usagesPage, setUsagesPage] = useState(1);

  const { data: freshPromo } = usePromoCodeQuery(promo.id);
  const { data: analytics, isLoading: analyticsLoading } = usePromoCodeAnalyticsQuery(promo.id);
  const { data: usagesData, isLoading: usagesLoading, isFetching: usagesFetching } =
    usePromoCodeUsagesQuery(promo.id, usagesPage, 10);
  const toggleMutation = useTogglePromoCodeMutation();

  const code = freshPromo ?? promo;
  const status = getPromoStatus(code);
  const statusCfg = statusConfig[status];

  const kpis = analytics?.kpis;
  const usages = usagesData?.data ?? [];
  const usagesMeta = usagesData?.meta;

  // Progression de la période (temps écoulé entre début et expiration)
  const periodProgress = useMemo(() => {
    const start = new Date(code.start_date).getTime();
    const end = new Date(code.expiration_date).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
  }, [code.start_date, code.expiration_date]);

  // Jauge d'utilisation (si limite globale définie)
  const usageProgress = useMemo(() => {
    if (!code.max_usage) return null;
    return Math.min(100, Math.round((code.usage_count / code.max_usage) * 100));
  }, [code.usage_count, code.max_usage]);

  const byDay = useMemo(() => {
    if (!analytics) return [];
    return fillMissingDays(analytics.by_day).map((d) => ({
      ...d,
      label: new Date(`${d.date}T00:00:00Z`).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      }),
    }));
  }, [analytics]);

  const byHour = useMemo(() => {
    if (!analytics) return [];
    return analytics.by_hour.map((h) => ({ ...h, label: `${String(h.hour).padStart(2, "0")}h` }));
  }, [analytics]);

  const byWeekday = useMemo(() => {
    if (!analytics) return [];
    const byIdx = new Map(analytics.by_weekday.map((w) => [w.weekday, w.usages]));
    return WEEKDAY_ORDER.map((idx) => ({
      label: WEEKDAY_LABELS[idx],
      usages: byIdx.get(idx) ?? 0,
    }));
  }, [analytics]);

  const handleCopy = (value: string, message: string) => {
    navigator.clipboard.writeText(value);
    toast.success(message);
  };

  const targetingLabel =
    code.target_type === "SPECIFIC_PRODUCTS"
      ? `${code.promo_code_targeted_dishes?.length ?? 0} plat${(code.promo_code_targeted_dishes?.length ?? 0) > 1 ? "s" : ""} ciblé${(code.promo_code_targeted_dishes?.length ?? 0) > 1 ? "s" : ""}`
      : code.target_type === "CATEGORIES"
        ? `${code.promo_code_targeted_categories?.length ?? 0} catégorie${(code.promo_code_targeted_categories?.length ?? 0) > 1 ? "s" : ""} ciblée${(code.promo_code_targeted_categories?.length ?? 0) > 1 ? "s" : ""}`
        : "Tous les produits";

  const hasUsages = (kpis?.total_usages ?? 0) > 0;

  return (
    <div className="flex-1 px-4 pt-4 pb-10 space-y-5">
      <DashboardPageHeader
        mode="view"
        onBack={onBack}
        title={`Code ${code.code}`}
        subtitle="Performances et utilisations du code promo"
        actions={[
          {
            label: "Modifier",
            onClick: () => onEdit(code),
            variant: "secondary" as const,
            icon: Pencil,
          },
        ]}
      />

      {/* ===== Carte d'identité ===== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          {/* Code + statut + description */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-lg sm:text-xl text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                {code.code}
              </span>
              <button
                onClick={() => handleCopy(code.code, `Code "${code.code}" copié`)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copier le code"
              >
                <Copy size={16} className="text-gray-400" />
              </button>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.className}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <button
                onClick={() => toggleMutation.mutate(code.id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title={code.is_active ? "Désactiver" : "Activer"}
              >
                {code.is_active ? (
                  <ToggleRight size={20} className="text-green-600" />
                ) : (
                  <ToggleLeft size={20} className="text-gray-400" />
                )}
              </button>
            </div>
            {code.description && (
              <p className="mt-2 text-sm text-gray-600">{code.description}</p>
            )}

            {/* Config de la réduction */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Réduction</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 flex items-center gap-1">
                  {code.discount_type === "PERCENTAGE" ? (
                    <>
                      <Percent size={13} className="text-blue-500" />
                      {code.discount_value}%
                    </>
                  ) : (
                    <>
                      <DollarSign size={13} className="text-green-500" />
                      {formatFCFA(code.discount_value)}
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Min. commande</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {code.min_order_amount ? formatFCFA(code.min_order_amount) : "Aucun"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Plafond réduction</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {code.max_discount_amount ? formatFCFA(code.max_discount_amount) : "Illimité"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Limite / client</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {code.max_usage_per_user ?? "Illimitée"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Ciblage</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">{targetingLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Créé par</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
                  {code.creator?.fullname ?? "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Période + jauges */}
          <div className="lg:w-72 shrink-0 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Période
                </span>
                <span>{periodProgress}% écoulée</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${status === "expired" ? "bg-red-400" : "bg-[#F17922]"}`}
                  style={{ width: `${periodProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs text-gray-600">
                <span>{formatDate(code.start_date)}</span>
                <span>{formatDate(code.expiration_date)}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  Utilisations
                </span>
                <span className="font-medium text-gray-900">
                  {code.usage_count}
                  <span className="text-gray-400">/{code.max_usage ?? "∞"}</span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F17922] rounded-full transition-all"
                  style={{ width: `${usageProgress ?? (code.usage_count > 0 ? 100 : 0)}%` }}
                />
              </div>
              {usageProgress !== null && usageProgress >= 90 && (
                <p className="mt-1.5 text-xs text-amber-600 font-medium">
                  ⚠️ Limite globale presque atteinte
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== KPIs ===== */}
      {analyticsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[88px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={Tag}
            iconBg="bg-orange-50"
            iconColor="text-[#F17922]"
            label="Utilisations"
            value={String(kpis?.total_usages ?? 0)}
            sub={code.max_usage ? `sur ${code.max_usage} max` : "sans limite globale"}
          />
          <KpiCard
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            label="Clients uniques"
            value={String(kpis?.unique_customers ?? 0)}
            sub={`${kpis?.orders_count ?? 0} commande${(kpis?.orders_count ?? 0) > 1 ? "s" : ""} liée${(kpis?.orders_count ?? 0) > 1 ? "s" : ""}`}
          />
          <KpiCard
            icon={BadgePercent}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            label="Réductions accordées"
            value={formatFCFA(kpis?.total_discount ?? 0)}
            sub={`moyenne ${formatFCFA(kpis?.avg_discount ?? 0)}`}
          />
          <KpiCard
            icon={TrendingUp}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            label="CA généré"
            value={formatFCFA(kpis?.total_revenue ?? 0)}
            sub="commandes utilisant le code"
          />
          <KpiCard
            icon={Wallet}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            label="Panier moyen"
            value={formatFCFA(kpis?.avg_basket ?? 0)}
          />
          <KpiCard
            icon={Repeat}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-600"
            label="Taux de réutilisation"
            value={`${Math.round((kpis?.repeat_rate ?? 0) * 100)}%`}
            sub="clients revenus avec le code"
          />
          <KpiCard
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            label="Première utilisation"
            value={kpis?.first_usage_at ? formatRelative(kpis.first_usage_at) : "-"}
            sub={kpis?.first_usage_at ? formatDateTime(kpis.first_usage_at) : undefined}
          />
          <KpiCard
            icon={ShoppingBag}
            iconBg="bg-pink-50"
            iconColor="text-pink-600"
            label="Dernière utilisation"
            value={kpis?.last_usage_at ? formatRelative(kpis.last_usage_at) : "-"}
            sub={kpis?.last_usage_at ? formatDateTime(kpis.last_usage_at) : undefined}
          />
        </div>
      )}

      {/* ===== Graphiques ===== */}
      {analyticsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonBlock className="h-72 lg:col-span-2" />
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-64" />
        </div>
      ) : !hasUsages ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-14 text-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Tag size={36} />
            <p className="text-sm font-medium text-gray-500">Aucune utilisation pour le moment</p>
            <p className="text-xs">
              Les statistiques apparaîtront dès que des clients utiliseront ce code.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Évolution par jour */}
          <ChartCard
            title="Évolution des utilisations"
            subtitle="Utilisations et réductions accordées par jour"
            className="lg:col-span-2"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={byDay} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="promoUsagesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F17922" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#F17922" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value: number, name: string) =>
                      name === "Réductions" ? [formatFCFA(value), name] : [value, name]
                    }
                    labelFormatter={(label: string) => `Le ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="usages"
                    name="Utilisations"
                    stroke="#F17922"
                    strokeWidth={2}
                    fill="url(#promoUsagesGradient)"
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="discount"
                    name="Réductions"
                    stroke="transparent"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Répartition par heure */}
          <ChartCard title="Heures d'utilisation" subtitle="Répartition sur 24 h — repérez les pics">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byHour} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value: number) => [value, "Utilisations"]}
                    labelFormatter={(label: string) => `À ${label}`}
                    cursor={{ fill: "rgba(241,121,34,0.06)" }}
                  />
                  <Bar dataKey="usages" name="Utilisations" fill="#F17922" radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Répartition par jour de semaine + top clients */}
          <div className="space-y-4">
            <ChartCard title="Jours de la semaine" subtitle="Quels jours le code est le plus utilisé">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byWeekday} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number) => [value, "Utilisations"]}
                      cursor={{ fill: "rgba(241,121,34,0.06)" }}
                    />
                    <Bar dataKey="usages" name="Utilisations" fill="#FDBA74" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Top clients */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Crown size={15} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900">Top clients</h3>
              </div>
              {analytics && analytics.top_customers.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                  {analytics.top_customers.map((c, idx) => (
                    <li key={c.customer_id} className="flex items-center gap-3 py-2">
                      <span className="text-xs font-semibold text-gray-400 w-4">#{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-[#F17922] text-xs font-bold flex items-center justify-center shrink-0">
                        {initials(c)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{customerName(c)}</p>
                        <p className="text-xs text-gray-400 truncate">{c.phone ?? "-"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {c.usages} util.
                        </p>
                        <p className="text-xs text-gray-400">{formatFCFA(c.total_discount)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center">Aucun client pour le moment</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Commandes ayant utilisé le code ===== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-1.5">
          <Receipt size={15} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Commandes avec ce code</h3>
          {usagesMeta && (
            <span className="ml-auto text-xs text-gray-400">
              {usagesMeta.total} utilisation{usagesMeta.total > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {usagesLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12" />
            ))}
          </div>
        ) : usages.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Receipt size={28} />
              <p className="text-sm">Aucune commande n&apos;a encore utilisé ce code</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop : table */}
            <div className="hidden md:block overflow-x-auto">
              <table className={`w-full ${usagesFetching ? "opacity-60" : ""}`}>
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commande</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Réduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usages.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{formatDateTime(u.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-50 text-[#F17922] text-xs font-bold flex items-center justify-center shrink-0">
                            {initials(u.customer)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {customerName(u.customer)}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone size={10} />
                              {u.customer?.phone ?? "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.order ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {u.order.reference}
                            </span>
                            <button
                              onClick={() => handleCopy(u.order!.reference, "Référence copiée")}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copier la référence"
                            >
                              <Copy size={12} className="text-gray-400" />
                            </button>
                            {u.order.status && (
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                                {ORDER_STATUS_LABELS[u.order.status] ?? u.order.status}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {u.order ? formatFCFA(u.order.amount) : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-red-500">
                          -{formatFCFA(u.discount_amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile : cartes */}
            <div className={`md:hidden divide-y divide-gray-100 ${usagesFetching ? "opacity-60" : ""}`}>
              {usages.map((u) => (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-orange-50 text-[#F17922] text-xs font-bold flex items-center justify-center shrink-0">
                      {initials(u.customer)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {customerName(u.customer)}
                      </p>
                      <p className="text-xs text-gray-400">{u.customer?.phone ?? "-"}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-500 shrink-0">
                      -{formatFCFA(u.discount_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDateTime(u.created_at)}</span>
                    {u.order && (
                      <span className="font-mono font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {u.order.reference} · {formatFCFA(u.order.amount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {usagesMeta && usagesMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
                <span className="text-sm text-gray-600">
                  Page {usagesMeta.page} sur {usagesMeta.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setUsagesPage((p) => Math.max(1, p - 1))}
                    disabled={usagesMeta.page <= 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setUsagesPage((p) => Math.min(usagesMeta.totalPages, p + 1))}
                    disabled={usagesMeta.page >= usagesMeta.totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
