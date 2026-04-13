"use client";

import React, { useState, useMemo } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import {
  Users,
  UserPlus,
  Trophy,
  Moon,
  Download,
  RefreshCcw,
  Shield,
  CreditCard,
  TrendingUp,
  MapPin,
  ShoppingBasket,
  Smartphone,
  Phone,
  UserCheck,
  UserX,
  AlertCircle,
  PhoneOff,
  ClipboardList,
  Fullscreen,
  Minimize2,
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
} from "recharts";
import { GoogleMap, HeatmapLayerF, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  useClientsOverviewQuery,
  useClientsAcquisitionQuery,
  useClientsRetentionQuery,
  useTopClientsQuery,
  useInactiveClientsQuery,
  useClientsByZoneQuery,
  useLoyaltyDistributionQuery,
  usePaymentMethodDistributionQuery,
  useRevenueConcentrationQuery,
  useBasketComparisonQuery,
} from "../../../../features/statistics/queries/statistics-clients.query";
import {
  useClientZonesQuery,
  useRestaurantsLocationsQuery,
} from "../../../../features/statistics/queries/statistics-orders.query";
import {
  StatsFilters,
  DEFAULT_STATS_FILTERS,
} from "../../../../features/statistics/filters/statistics.filters";
import {
  formatCurrencyXOF,
  formatNumber,
  formatPercentage,
  getPerformanceColor,
  getChannelLabel,
  truncateName,
} from "../../../../features/statistics/utils/stats-formatters";
import {
  CHART_COLORS,
  AXIS_STYLE,
  GRID_STYLE,
  AREA_GRADIENT_ID,
  AREA_GRADIENT_CONFIG,
  RESTAURANT_COLORS,
} from "../../../../features/statistics/utils/chart-config";
import {
  exportChurnToCSV,
  exportTopClientsToCSV,
} from "../../../../features/statistics/utils/export-excel";
import StatsPeriodFilter from "./shared/StatsPeriodFilter";
import StatsCard from "./shared/StatsCard";
import StatsChartCard from "./shared/StatsChartCard";
import ChartTooltip, { PieChartTooltip } from "./shared/ChartTooltip";
import StatsTable from "./shared/StatsTable";
import StatsLoadingState from "./shared/StatsLoadingState";
import StatsErrorState from "./shared/StatsErrorState";

// === Map Constants ===
const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "400px",
  borderRadius: "12px",
};

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

// === Helper: Generate SVG marker icon ===
function getRestaurantMarkerIcon(color: string, size = 32, selected = false) {
  if (selected) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-2 -2 28 28"><circle cx="12" cy="9" r="10" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.35"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="white" stroke-width="2.5"/></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// === Couleurs specifiques clients ===
const LOYALTY_COLORS: Record<string, string> = {
  STANDARD: CHART_COLORS.blue,
  PREMIUM: CHART_COLORS.primary,
  GOLD: "#F59E0B",
};
const LOYALTY_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  GOLD: "Gold",
};
const PAYMENT_COLORS: Record<string, string> = {
  ONLINE: CHART_COLORS.success,
  OFFLINE: CHART_COLORS.primary,
};
const PAYMENT_LABELS: Record<string, string> = {
  ONLINE: "En ligne",
  OFFLINE: "Espèces / Sur place",
};
const ACQUISITION_COLORS = {
  newApp: CHART_COLORS.primary,
  newCallCenter: CHART_COLORS.blue,
  recurringApp: "rgba(241, 121, 34, 0.35)",
  recurringCallCenter: "rgba(59, 130, 246, 0.35)",
} as const;

export default function StatsClients() {
  const { selectedRestaurantId, setActiveTab } = useDashboardStore();
  const [filters, setFilters] = useState<StatsFilters>({
    ...DEFAULT_STATS_FILTERS,
    restaurantId: selectedRestaurantId ?? undefined,
  });
  const [inactiveDays, setInactiveDays] = useState(30);
  const [fullScreen, setFullScreen] = useState(false);

  const [selectedMapRestaurant, setSelectedMapRestaurant] = useState<string | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  const queryParams = {
    ...filters,
    restaurantId: filters.restaurantId ?? selectedRestaurantId ?? undefined,
  };

  // ---- Queries ----
  const overview = useClientsOverviewQuery(queryParams);
  const acquisition = useClientsAcquisitionQuery(queryParams);
  const retention = useClientsRetentionQuery(queryParams.restaurantId);
  const topClients = useTopClientsQuery({ ...queryParams, limit: 10 });
  const inactive = useInactiveClientsQuery({
    restaurantId: queryParams.restaurantId,
    inactiveDays,
    limit: 100,
  });
  const byZone = useClientsByZoneQuery({ ...queryParams, limit: 10 });
  const loyalty = useLoyaltyDistributionQuery(queryParams);
  const paymentMethods = usePaymentMethodDistributionQuery(queryParams);
  const revenueConcentration = useRevenueConcentrationQuery(queryParams);
  const basketComparison = useBasketComparisonQuery(queryParams);
  const clientZones = useClientZonesQuery(queryParams);
  const restaurantsLocations = useRestaurantsLocationsQuery();


  const isLoading = overview.isLoading;
  const isError = overview.isError;

  // ---- Google Maps ----
  const { isScriptLoaded: mapsLoaded } = useGoogleMaps();

  const retentionRate = retention.data?.retentionRate ?? 0;

  // ---- Map derived data ----
  const restaurantColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const restaurants = restaurantsLocations.data?.restaurants ?? [];
    restaurants.forEach((r, i) => {
      map.set(r.id, RESTAURANT_COLORS[i % RESTAURANT_COLORS.length]);
    });
    return map;
  }, [restaurantsLocations.data]);

  const heatmapData = useMemo(() => {
    if (!mapsLoaded || !clientZones.data?.points?.length) return [];
    return clientZones.data.points.map((p) => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      weight: p.count,
    }));
  }, [mapsLoaded, clientZones.data]);

  const mapCenter = useMemo(() => {
    if (clientZones.data?.center) {
      return { lat: clientZones.data.center.lat, lng: clientZones.data.center.lng };
    }
    return { lat: 6.3703, lng: 2.3912 };
  }, [clientZones.data]);

  const selectedMapRestaurantName = useMemo(() => {
    if (!selectedMapRestaurant) return null;
    const found = restaurantsLocations.data?.restaurants?.find((r) => r.id === selectedMapRestaurant);
    return found?.name ?? null;
  }, [selectedMapRestaurant, restaurantsLocations.data]);

  // ---- Donnees derivees : PieChart nouveaux vs recurrents ----
  const totalNewRecurring =
    (overview.data?.newClients ?? 0) + (overview.data?.recurringClients ?? 0);
  const newRecurringData = [
    {
      name: "Nouveaux",
      value: overview.data?.newClients ?? 0,
      fill: CHART_COLORS.primary,
      percentage: overview.data?.newClientsRate ?? 0,
    },
    {
      name: "Récurrents",
      value: overview.data?.recurringClients ?? 0,
      fill: CHART_COLORS.blue,
      percentage:
        totalNewRecurring > 0
          ? parseFloat(
              (
                ((overview.data?.recurringClients ?? 0) / totalNewRecurring) *
                100
              ).toFixed(1)
            )
          : 0,
    },
  ];

  // ---- Donnees derivees : PieChart fidelite ----
  const loyaltyChartData = (loyalty.data?.items ?? []).map((item) => ({
    name: LOYALTY_LABELS[item.level] ?? item.level,
    value: item.clientCount,
    fill: LOYALTY_COLORS[item.level] ?? CHART_COLORS.textMuted,
    percentage: item.percentage,
  }));

  // ---- Donnees derivees : PieChart paiement ----
  const paymentChartData = (paymentMethods.data?.items ?? []).map((item) => ({
    name: PAYMENT_LABELS[item.method] ?? item.method,
    value: item.clientCount,
    fill: PAYMENT_COLORS[item.method] ?? CHART_COLORS.textMuted,
    percentage: item.percentage,
  }));

  // ---- Donnees derivees : Pareto BarChart ----
  const paretoData = revenueConcentration.data
    ? [
        {
          name: "Top 10%",
          percentage: revenueConcentration.data.top10Percentage,
          fill: CHART_COLORS.danger,
        },
        {
          name: "Top 20%",
          percentage: revenueConcentration.data.top20Percentage,
          fill: CHART_COLORS.primary,
        },
        {
          name: "Top 50%",
          percentage: revenueConcentration.data.top50Percentage,
          fill: CHART_COLORS.blue,
        },
      ]
    : [];

  // ---- Exports ----
  const handleExportTopClients = () => {
    if (!topClients.data) return;
    exportTopClientsToCSV(
      topClients.data.items.map((c) => ({
        fullname: c.fullname,
        phone: c.phone,
        email: c.email,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent,
        averageBasket: c.averageBasket,
        lastOrderDate: c.lastOrderDate,
        preferredChannel: getChannelLabel(c.preferredChannel),
        loyaltyLevel: c.loyaltyLevel,
      }))
    );
  };

  const handleExportChurn = () => {
    if (!inactive.data) return;
    exportChurnToCSV(
      inactive.data.items.map((c) => ({
        phone: c.phone,
        firstName: c.fullname.split(" ")[0] ?? "",
        lastName: c.fullname.split(" ").slice(1).join(" ") ?? "",
        email: c.email,
        lastOrderDate: c.lastOrderDate,
        daysSinceLastOrder: c.daysSinceLastOrder,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent,
        preferredChannel: getChannelLabel(c.preferredChannel),
      })),
      inactiveDays
    );
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Statistiques Clients"
          subtitle="Acquisition, rétention, LTV et profils clients"
          actions={[{ label: "", onClick: () => {}, customComponent: <StatsPeriodFilter filters={filters} onChange={setFilters} /> }]}
        />
      </div>

      {isLoading && <StatsLoadingState />}
      {isError && <StatsErrorState onRetry={() => overview.refetch()} />}

      {!isLoading && !isError && (
        <>
          {/* ========================================== */}
          {/* SECTION 2 : KPI Cards                     */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Clients"
              value={formatNumber(overview.data?.totalClients ?? 0)}
              subtitle="clients actifs"
              color="orange"
            />
            <StatsCard
              title="Nouveaux Clients"
              value={formatNumber(overview.data?.newClients ?? 0)}
              subtitle={`${formatPercentage(overview.data?.newClientsRate ?? 0)} du total`}
              color="blue"
            />
            <StatsCard
              title="LTV Moyen"
              value={formatCurrencyXOF(overview.data?.averageLtv ?? 0)}
              subtitle="valeur vie client"
              color="green"
            />
            <StatsCard
              title="Taux de Rétention"
              value={`${retentionRate.toFixed(1)}%`}
              subtitle="sur 30 jours"
              color={
                retentionRate >= 70
                  ? "green"
                  : retentionRate >= 40
                  ? "orange"
                  : "red"
              }
            />
          </div>

          {/* ========================================== */}
          {/* SECTION 2B : Rapport Segments              */}
          {/* ========================================== */}
          {overview.data && overview.data.totalAllCustomers > 0 && (() => {
            const total = overview.data.totalAllCustomers;
            const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0;
            const segments = [
              { label: "Tous", value: total, pct: 100, color: "bg-gray-100 text-gray-700", icon: Users },
              { label: "Utilisateurs app", value: total - overview.data.noAppClients, pct: pct(total - overview.data.noAppClients), color: "bg-orange-50 text-[#F17922]", icon: Smartphone },
              { label: "Sans app", value: overview.data.noAppClients, pct: pct(overview.data.noAppClients), color: "bg-blue-50 text-blue-700", icon: PhoneOff },
              { label: "Ont commandé", value: overview.data.hasOrderedClients, pct: pct(overview.data.hasOrderedClients), color: "bg-green-50 text-green-700", icon: UserCheck },
              { label: "Jamais commandé", value: overview.data.neverOrderedClients, pct: pct(overview.data.neverOrderedClients), color: "bg-red-50 text-red-600", icon: UserX },
              { label: "Profil incomplet", value: overview.data.incompleteProfileClients, pct: pct(overview.data.incompleteProfileClients), color: "bg-purple-50 text-purple-700", icon: AlertCircle },
            ];
            return (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  Rapport par Segment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {segments.map((seg) => (
                    <div key={seg.label} className={`rounded-xl p-3 ${seg.color.split(" ")[0]} border border-gray-100`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <seg.icon className={`w-3.5 h-3.5 ${seg.color.split(" ")[1]}`} />
                        <span className={`text-[11px] font-semibold ${seg.color.split(" ")[1]}`}>
                          {seg.label}
                        </span>
                      </div>
                      <div className={`text-lg font-bold ${seg.color.split(" ")[1]}`}>
                        {formatNumber(seg.value)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {seg.pct}% du total
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ========================================== */}
          {/* SECTION 3 : Tendance Acquisition AreaChart */}
          {/* ========================================== */}
          {acquisition.data &&
            acquisition.data.dailyTrend &&
            acquisition.data.dailyTrend.length > 0 && (
              <StatsChartCard
                title="Tendance d'Acquisition"
                subtitle={`${formatNumber(acquisition.data.totalNew)} nouveaux · ${formatNumber(acquisition.data.totalRecurring)} récurrents`}
                icon={TrendingUp}
              >
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={acquisition.data.dailyTrend}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="gradNewApp"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={ACQUISITION_COLORS.newApp}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={ACQUISITION_COLORS.newApp}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gradNewCC"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={ACQUISITION_COLORS.newCallCenter}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={ACQUISITION_COLORS.newCallCenter}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis
                        dataKey="label"
                        tick={AXIS_STYLE}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={AXIS_STYLE}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip
                            valueFormatter={(v) =>
                              `${formatNumber(v)} clients`
                            }
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="newViaApp"
                        name="Nouveaux App"
                        stroke={ACQUISITION_COLORS.newApp}
                        fill="url(#gradNewApp)"
                        strokeWidth={2}
                        dot={false}
                        stackId="new"
                      />
                      <Area
                        type="monotone"
                        dataKey="newViaCallCenter"
                        name="Nouveaux Call Center"
                        stroke={ACQUISITION_COLORS.newCallCenter}
                        fill="url(#gradNewCC)"
                        strokeWidth={2}
                        dot={false}
                        stackId="new"
                      />
                      <Area
                        type="monotone"
                        dataKey="recurringViaApp"
                        name="Récurrents App"
                        stroke={ACQUISITION_COLORS.recurringApp}
                        fill="transparent"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="recurringViaCallCenter"
                        name="Récurrents Call Center"
                        stroke={ACQUISITION_COLORS.recurringCallCenter}
                        fill="transparent"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Légende */}
                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className="w-3 h-0.5 rounded"
                      style={{
                        backgroundColor: ACQUISITION_COLORS.newApp,
                      }}
                    />
                    Nouveaux App
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className="w-3 h-0.5 rounded"
                      style={{
                        backgroundColor: ACQUISITION_COLORS.newCallCenter,
                      }}
                    />
                    Nouveaux Call Center
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className="w-3 h-0.5 rounded border border-dashed"
                      style={{
                        borderColor: ACQUISITION_COLORS.recurringApp,
                      }}
                    />
                    Récurrents App
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className="w-3 h-0.5 rounded border border-dashed"
                      style={{
                        borderColor: ACQUISITION_COLORS.recurringCallCenter,
                      }}
                    />
                    Récurrents Call Center
                  </div>
                </div>
              </StatsChartCard>
            )}

          {/* ========================================== */}
          {/* SECTION 4 : Nouveaux vs Recurrents + Panier */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 4A - PieChart nouveaux vs recurrents + canal */}
            <StatsChartCard
              title="Nouveaux vs Récurrents"
              subtitle="Répartition sur la période"
              icon={UserPlus}
            >
              {totalNewRecurring > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-55">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={newRecurringData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={82}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {newRecurringData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <PieChartTooltip
                              valueFormatter={(v) =>
                                `${formatNumber(v)} clients`
                              }
                            />
                          }
                        />
                        <text
                          x="50%"
                          y="44%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-gray-900 text-xl font-bold"
                        >
                          {formatNumber(totalNewRecurring)}
                        </text>
                        <text
                          x="50%"
                          y="57%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-gray-400 text-[10px]"
                        >
                          clients
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-3">
                    {/* Nouveaux */}
                    <div className="bg-orange-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#F17922]">
                          Nouveaux
                        </span>
                        <span className="text-sm font-bold text-[#F17922]">
                          {formatPercentage(overview.data?.newClientsRate ?? 0)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(overview.data?.newClients ?? 0)} clients
                      </div>
                    </div>
                    {/* Recurrents */}
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-700">
                          Récurrents
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          {formatPercentage(
                            newRecurringData[1]?.percentage ?? 0
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(
                          overview.data?.recurringClients ?? 0
                        )}{" "}
                        clients
                      </div>
                    </div>
                    {/* Canal acquisition */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          App
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                          {formatNumber(overview.data?.appClients ?? 0)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                          <Phone className="w-3 h-3" />
                          Call Center
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                          {formatNumber(
                            overview.data?.callCenterClients ?? 0
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-55 flex items-center justify-center text-sm text-gray-400">
                  Aucune donnée disponible
                </div>
              )}
            </StatsChartCard>

            {/* 4B - Panier moyen nouveaux vs recurrents */}
            <StatsChartCard
              title="Panier Moyen Comparé"
              subtitle="Nouveaux clients vs Récurrents"
              icon={ShoppingBasket}
            >
              {basketComparison.data ? (
                <div className="space-y-4">
                  {/* Barres visuelles comparatives */}
                  <div className="space-y-4">
                    {/* Nouveaux */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#F17922]">
                          Nouveaux clients
                        </span>
                        <span className="text-sm font-bold text-[#F17922]">
                          {formatCurrencyXOF(
                            basketComparison.data.newClientsBasket
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-orange-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: CHART_COLORS.primary,
                            width: `${
                              Math.max(
                                basketComparison.data.newClientsBasket,
                                basketComparison.data.recurringClientsBasket
                              ) > 0
                                ? (basketComparison.data.newClientsBasket /
                                    Math.max(
                                      basketComparison.data.newClientsBasket,
                                      basketComparison.data
                                        .recurringClientsBasket
                                    )) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                        <span>
                          {formatNumber(
                            basketComparison.data.newClientsOrders
                          )}{" "}
                          commandes
                        </span>
                        <span>
                          CA :{" "}
                          {formatCurrencyXOF(
                            basketComparison.data.newClientsRevenue
                          )}
                        </span>
                      </div>
                    </div>
                    {/* Recurrents */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-blue-700">
                          Clients récurrents
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          {formatCurrencyXOF(
                            basketComparison.data.recurringClientsBasket
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: CHART_COLORS.blue,
                            width: `${
                              Math.max(
                                basketComparison.data.newClientsBasket,
                                basketComparison.data.recurringClientsBasket
                              ) > 0
                                ? (basketComparison.data
                                    .recurringClientsBasket /
                                    Math.max(
                                      basketComparison.data.newClientsBasket,
                                      basketComparison.data
                                        .recurringClientsBasket
                                    )) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                        <span>
                          {formatNumber(
                            basketComparison.data.recurringClientsOrders
                          )}{" "}
                          commandes
                        </span>
                        <span>
                          CA :{" "}
                          {formatCurrencyXOF(
                            basketComparison.data.recurringClientsRevenue
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Ecart */}
                  {basketComparison.data.recurringClientsBasket > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-400">
                        Écart panier moyen
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {basketComparison.data.recurringClientsBasket >
                        basketComparison.data.newClientsBasket
                          ? "+"
                          : ""}
                        {formatCurrencyXOF(
                          basketComparison.data.recurringClientsBasket -
                            basketComparison.data.newClientsBasket
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        en faveur des{" "}
                        {basketComparison.data.recurringClientsBasket >=
                        basketComparison.data.newClientsBasket
                          ? "récurrents"
                          : "nouveaux"}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-55 flex items-center justify-center text-sm text-gray-400">
                  Aucune donnée disponible
                </div>
              )}
            </StatsChartCard>
          </div>

          {/* ========================================== */}
          {/* SECTION 5 : Fidélité + Paiement (2 cols)  */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 5A - Répartition par niveau de fidélité */}
            <StatsChartCard
              title="Niveaux de Fidélité"
              subtitle={`${formatNumber(loyalty.data?.totalClients ?? 0)} clients au total`}
              icon={Shield}
            >
              {loyaltyChartData.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-55">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={loyaltyChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={82}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {loyaltyChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <PieChartTooltip
                              valueFormatter={(v) =>
                                `${formatNumber(v)} clients`
                              }
                            />
                          }
                        />
                        <text
                          x="50%"
                          y="44%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-gray-900 text-xl font-bold"
                        >
                          {formatNumber(loyalty.data?.totalClients ?? 0)}
                        </text>
                        <text
                          x="50%"
                          y="57%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-gray-400 text-[10px]"
                        >
                          clients
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    {(loyalty.data?.items ?? []).map((item) => (
                      <div
                        key={item.level}
                        className="rounded-xl p-2.5"
                        style={{
                          backgroundColor:
                            item.level === "GOLD"
                              ? "rgba(245, 158, 11, 0.1)"
                              : item.level === "PREMIUM"
                              ? "rgba(241, 121, 34, 0.1)"
                              : "rgba(59, 130, 246, 0.1)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color:
                                LOYALTY_COLORS[item.level] ??
                                CHART_COLORS.textSecondary,
                            }}
                          >
                            {LOYALTY_LABELS[item.level] ?? item.level}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color:
                                LOYALTY_COLORS[item.level] ??
                                CHART_COLORS.textSecondary,
                            }}
                          >
                            {formatPercentage(item.percentage)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>{formatNumber(item.clientCount)} clients</span>
                          <span>
                            Moy. {formatCurrencyXOF(item.averageRevenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-55 flex items-center justify-center text-sm text-gray-400">
                  Aucune donnée disponible
                </div>
              )}
            </StatsChartCard>

            {/* 5B - Répartition par méthode de paiement */}
            <StatsChartCard
              title="Méthodes de Paiement"
              subtitle={`${formatNumber(paymentMethods.data?.totalClients ?? 0)} clients`}
              icon={CreditCard}
            >
              {paymentChartData.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-55">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={82}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {paymentChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <PieChartTooltip
                              valueFormatter={(v) =>
                                `${formatNumber(v)} clients`
                              }
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-3">
                    {(paymentMethods.data?.items ?? []).map((item) => (
                      <div
                        key={item.method}
                        className="rounded-xl p-3"
                        style={{
                          backgroundColor:
                            item.method === "ONLINE"
                              ? "rgba(34, 197, 94, 0.1)"
                              : "rgba(241, 121, 34, 0.1)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color:
                                PAYMENT_COLORS[item.method] ??
                                CHART_COLORS.textSecondary,
                            }}
                          >
                            {PAYMENT_LABELS[item.method] ?? item.method}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color:
                                PAYMENT_COLORS[item.method] ??
                                CHART_COLORS.textSecondary,
                            }}
                          >
                            {formatPercentage(item.percentage)}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[10px] text-gray-500">
                          <div className="flex justify-between">
                            <span>Clients</span>
                            <span className="font-medium">
                              {formatNumber(item.clientCount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Commandes</span>
                            <span className="font-medium">
                              {formatNumber(item.orderCount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>CA</span>
                            <span className="font-medium">
                              {formatCurrencyXOF(item.revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-55 flex items-center justify-center text-sm text-gray-400">
                  Aucune donnée disponible
                </div>
              )}
            </StatsChartCard>
          </div>

          {/* ========================================== */}
          {/* SECTION 6 : Rétention + Pareto (2 cols)   */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 6A - Rétention & Churn */}
            {retention.data && (
              <StatsChartCard
                title="Rétention & Churn"
                subtitle="Analyse de l'activité clients"
                icon={RefreshCcw}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1 font-medium">
                      Taux de rétention
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: getPerformanceColor(retentionRate) }}
                    >
                      {retentionRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1 font-medium">
                      Clients actifs
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {formatNumber(retention.data.activeClients)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      commandé dans les 30j
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1 font-medium">
                      Churn 30j
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {retention.data.churnRate30.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {formatNumber(retention.data.churn30Days)} clients
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1 font-medium">
                      Churn 60j
                    </div>
                    <div className="text-2xl font-bold text-red-500">
                      {retention.data.churnRate60.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {formatNumber(retention.data.churn60Days)} clients
                    </div>
                  </div>
                </div>
                {/* Clients à risque */}
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-amber-700">
                      ⚠️ Clients à risque
                    </div>
                    <div className="text-[10px] text-amber-600 mt-0.5">
                      Inactifs depuis 15-30 jours
                    </div>
                  </div>
                  <div className="text-xl font-bold text-amber-700">
                    {formatNumber(retention.data.atRiskClients)}
                  </div>
                </div>
              </StatsChartCard>
            )}

            {/* 6B - Concentration du CA (Pareto) */}
            {revenueConcentration.data && paretoData.length > 0 && (
              <StatsChartCard
                title="Concentration du CA (Pareto)"
                subtitle={`CA total : ${formatCurrencyXOF(revenueConcentration.data.totalRevenue)} · ${formatNumber(revenueConcentration.data.totalClients)} clients`}
                icon={TrendingUp}
              >
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={paretoData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid {...GRID_STYLE} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={AXIS_STYLE}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={AXIS_STYLE}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip
                            valueFormatter={(v) =>
                              `${v.toFixed(1)}% du CA total`
                            }
                          />
                        }
                      />
                      <Bar
                        dataKey="percentage"
                        name="Part du CA"
                        radius={[8, 8, 0, 0]}
                        barSize={50}
                      >
                        {paretoData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                        <LabelList
                          dataKey="percentage"
                          position="top"
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fill: CHART_COLORS.textPrimary,
                          }}
                          formatter={(v: number) => `${v.toFixed(1)}%`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Insight */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
                  <span className="font-semibold text-gray-700">
                    {revenueConcentration.data.top10Percentage.toFixed(0)}%
                  </span>{" "}
                  du CA est généré par les{" "}
                  <span className="font-semibold text-gray-700">10%</span>{" "}
                  meilleurs clients
                </div>
              </StatsChartCard>
            )}
          </div>

          {/* ========================================== */}
          {/* SECTION 7 : Top 10 Clients (table)        */}
          {/* ========================================== */}
          <StatsChartCard
            title="Top 10 Clients"
            subtitle="Classés par chiffre d'affaires"
            icon={Trophy}
            rightContent={
              topClients.data && (
                <button
                  onClick={handleExportTopClients}
                  className="text-xs text-[#F17922] hover:underline font-medium flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Exporter CSV
                </button>
              )
            }
          >
            <StatsTable
              columns={[
                { key: "rank", label: "#", width: "40px" },
                { key: "name", label: "Client" },
                { key: "orders", label: "Commandes", align: "right" },
                { key: "ltv", label: "LTV", align: "right" },
                { key: "basket", label: "Panier moy.", align: "right" },
                { key: "channel", label: "Canal" },
                { key: "loyalty", label: "Fidélité" },
              ]}
              rows={(topClients.data?.items ?? []).map((c, i) => ({
                rank: (
                  <span className="font-bold text-[#F17922]">#{i + 1}</span>
                ),
                name: (
                  <div>
                    <div className="font-medium text-gray-800">
                      {truncateName(c.fullname)}
                    </div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </div>
                ),
                orders: (
                  <span className="font-semibold">
                    {formatNumber(c.totalOrders)}
                  </span>
                ),
                ltv: (
                  <span className="text-green-700 font-medium">
                    {c.totalSpentFormatted}
                  </span>
                ),
                basket: (
                  <span className="text-gray-600">
                    {formatCurrencyXOF(c.averageBasket)}
                  </span>
                ),
                channel: (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      c.preferredChannel === "APP"
                        ? "bg-orange-50 text-[#F17922]"
                        : c.preferredChannel === "CALL_CENTER"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {getChannelLabel(c.preferredChannel)}
                  </span>
                ),
                loyalty: (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor:
                        c.loyaltyLevel === "GOLD"
                          ? "rgba(245, 158, 11, 0.15)"
                          : c.loyaltyLevel === "PREMIUM"
                          ? "rgba(241, 121, 34, 0.15)"
                          : "rgba(59, 130, 246, 0.1)",
                      color:
                        LOYALTY_COLORS[c.loyaltyLevel] ??
                        CHART_COLORS.textSecondary,
                    }}
                  >
                    {LOYALTY_LABELS[c.loyaltyLevel] ?? c.loyaltyLevel}
                  </span>
                ),
              }))}
            />
          </StatsChartCard>

          {/* ========================================== */}
          {/* SECTION 8 : Zones + Inactifs              */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 8A - Clients par Zone */}
            {byZone.data && (byZone.data.items?.length ?? 0) > 0 && (
              <StatsChartCard
                title="Clients par Zone"
                subtitle={`${formatNumber(byZone.data.totalClients)} clients au total`}
                icon={MapPin}
              >
                <StatsTable
                  columns={[
                    { key: "rank", label: "#", width: "35px" },
                    { key: "zone", label: "Zone" },
                    {
                      key: "clients",
                      label: "Clients",
                      align: "right" as const,
                    },
                    {
                      key: "orders",
                      label: "Commandes",
                      align: "right" as const,
                    },
                    {
                      key: "part",
                      label: "Part",
                      align: "right" as const,
                    },
                  ]}
                  rows={(byZone.data.items ?? []).map((z, i) => ({
                    rank: (
                      <span className="font-bold text-[#F17922]">
                        #{i + 1}
                      </span>
                    ),
                    zone: (
                      <span className="font-medium text-gray-800">
                        {z.zone}
                      </span>
                    ),
                    clients: (
                      <span className="font-semibold">
                        {formatNumber(z.clientCount)}
                      </span>
                    ),
                    orders: (
                      <span className="text-gray-600">
                        {formatNumber(z.orderCount)}
                      </span>
                    ),
                    part: (
                      <span className="bg-orange-50 text-[#F17922] px-2 py-0.5 rounded-full text-xs font-medium">
                        {formatPercentage(z.percentage)}
                      </span>
                    ),
                  }))}
                />
              </StatsChartCard>
            )}

            {/* 8B - Clients Inactifs */}
            <StatsChartCard
              title="Clients Inactifs"
              subtitle="Exportez pour campagne SMS/WhatsApp Twilio"
              icon={Moon}
              rightContent={
                <div className="flex items-center gap-2">
                  <select
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(Number(e.target.value))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700"
                  >
                    <option value={15}>Inactifs 15j</option>
                    <option value={30}>Inactifs 30j</option>
                    <option value={60}>Inactifs 60j</option>
                    <option value={90}>Inactifs 90j</option>
                  </select>
                  {inactive.data && (
                    <button
                      onClick={handleExportChurn}
                      className="px-3 py-1.5 bg-[#F17922] text-white text-xs font-medium rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      {formatNumber(inactive.data.totalCount)}
                    </button>
                  )}
                </div>
              }
            >
              <StatsTable
                columns={[
                  { key: "name", label: "Client" },
                  { key: "phone", label: "Tél." },
                  { key: "lastOrder", label: "Dernière cmd." },
                  {
                    key: "days",
                    label: "Inactif",
                    align: "right" as const,
                  },
                  {
                    key: "orders",
                    label: "Total cmd.",
                    align: "right" as const,
                  },
                  {
                    key: "action",
                    label: "",
                    align: "right" as const,
                  },
                ]}
                rows={(inactive.data?.items ?? []).slice(0, 8).map((c) => ({
                  name: (
                    <span className="font-medium text-gray-800">
                      {truncateName(c.fullname, 18)}
                    </span>
                  ),
                  phone: (
                    <span className="text-gray-500 text-xs">{c.phone}</span>
                  ),
                  lastOrder: (
                    <span className="text-gray-500 text-xs">
                      {new Date(c.lastOrderDate).toLocaleDateString("fr-FR")}
                    </span>
                  ),
                  days: (
                    <span
                      className={`font-semibold ${
                        c.daysSinceLastOrder >= 60
                          ? "text-red-500"
                          : "text-yellow-600"
                      }`}
                    >
                      {c.daysSinceLastOrder}j
                    </span>
                  ),
                  orders: (
                    <span className="text-gray-600">
                      {formatNumber(c.totalOrders)}
                    </span>
                  ),
                  action: (
                    <button
                      onClick={() => {
                        setActiveTab("stats_retention_callbacks" as any);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[#F17922] bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors whitespace-nowrap"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      Rappeler
                    </button>
                  ),
                }))}
                emptyMessage="Aucun client inactif sur cette période"
              />
              {(inactive.data?.totalCount ?? 0) > 8 && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Affichage des 8 premiers — exportez le CSV pour voir les{" "}
                  {formatNumber(inactive.data!.totalCount)} clients
                </p>
              )}
            </StatsChartCard>
          </div>

          {/* ========================================== */}
          {/* SECTION : Zones Clients (Heat Map)        */}
          {/* avec marqueurs restaurants + filtre        */}
          {/* ========================================== */}
          {clientZones.data && clientZones.data.points.length > 0 && (
            <div className={fullScreen ? "fixed inset-0 z-50 bg-white p-6 overflow-auto" : ""}>
              <StatsChartCard
                title="Zones Clients"
                subtitle={
                  selectedMapRestaurantName
                    ? `Filtre : ${selectedMapRestaurantName} — Cliquer ailleurs pour reinitialiser`
                    : `${formatNumber(clientZones.data.totalPoints)} zones identifiees sur ${formatNumber(clientZones.data.totalOrders)} commandes livrees`
                }
                icon={MapPin}
                rightContent={
                  <div className="flex items-center gap-2">
                    {selectedMapRestaurant && (
                      <button
                        onClick={() => setSelectedMapRestaurant(null)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Reinitialiser
                      </button>
                    )}
                    <button
                      onClick={() => setFullScreen(!fullScreen)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-white shadow-sm text-[#F17922]"
                    >
                      {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
                    </button>
                  </div>
                }
              >
                {mapsLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ ...MAP_CONTAINER_STYLE, height: fullScreen ? 'calc(100vh - 200px)' : '400px' }}
                    center={mapCenter}
                    zoom={12}
                    options={MAP_OPTIONS}
                  >
                    {heatmapData.length > 0 && (
                      <HeatmapLayerF
                        data={heatmapData}
                        options={{
                          radius: 30,
                          opacity: 0.7,
                          gradient: [
                            "rgba(0, 0, 0, 0)",
                            "rgba(255, 255, 0, 0.4)",
                            "rgba(255, 165, 0, 0.6)",
                            "rgba(255, 69, 0, 0.8)",
                            "rgba(255, 0, 0, 1)",
                          ],
                        }}
                      />
                    )}

                    {/* Marqueurs restaurants */}
                    {restaurantsLocations.data?.restaurants?.map((restaurant) => {
                      const color = restaurantColorMap.get(restaurant.id) ?? CHART_COLORS.primary;
                      const isSelected = selectedMapRestaurant === restaurant.id;
                      const isFiltered = selectedMapRestaurant !== null && !isSelected;
                      return (
                        <MarkerF
                          key={restaurant.id}
                          position={{ lat: restaurant.latitude, lng: restaurant.longitude }}
                          icon={{
                            url: getRestaurantMarkerIcon(color, isSelected ? 44 : 32, isSelected),
                            scaledSize: new google.maps.Size(isSelected ? 44 : 32, isSelected ? 44 : 32),
                            anchor: new google.maps.Point(isSelected ? 22 : 16, isSelected ? 44 : 32),
                          }}
                          opacity={isFiltered ? 0.4 : 1}
                          onClick={() => {
                            setSelectedMapRestaurant(
                              selectedMapRestaurant === restaurant.id ? null : restaurant.id
                            );
                          }}
                          onMouseOver={() => setHoveredMarker(restaurant.id)}
                          onMouseOut={() => setHoveredMarker(null)}
                          zIndex={isSelected ? 100 : 10}
                        >
                          {hoveredMarker === restaurant.id && (
                            <InfoWindowF
                              position={{ lat: restaurant.latitude, lng: restaurant.longitude }}
                              onCloseClick={() => setHoveredMarker(null)}
                            >
                              <div className="p-1">
                                <p className="text-sm font-semibold text-gray-900">{restaurant.name}</p>
                                {restaurant.address && (
                                  <p className="text-xs text-gray-500 mt-0.5">{restaurant.address}</p>
                                )}
                              </div>
                            </InfoWindowF>
                          )}
                        </MarkerF>
                      );
                    })}
                  </GoogleMap>
                ) : (
                  <div className="h-50 bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-sm text-gray-400">Chargement de la carte...</div>
                  </div>
                )}
                {/* Legende */}
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255, 0, 0, 1)" }} />
                    <span className="text-xs text-gray-600">Forte concentration</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255, 165, 0, 0.8)" }} />
                    <span className="text-xs text-gray-600">Concentration moyenne</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255, 255, 0, 0.6)" }} />
                    <span className="text-xs text-gray-600">Faible concentration</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#F17922]" />
                    <span className="text-xs text-gray-600">Restaurants (clic pour filtrer)</span>
                  </div>
                </div>
              </StatsChartCard>
            </div>
          )}

        </>
      )}
    </div>
  );
}
