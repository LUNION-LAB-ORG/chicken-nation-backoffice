"use client";

import React, { useState, useCallback, useMemo } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import {
  TrendingUp,
  Smartphone,
  Phone,
  Clock,
  Target,
  Store,
  ChefHat,
  PieChart as PieChartIcon,
  Fullscreen,
  Minimize2,
  Map as MapIcon,
} from "lucide-react";
import { GoogleMap, CircleF, MarkerF } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
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
import {
  useOrdersOverviewQuery,
  useOrdersByChannelQuery,
  useOrdersProcessingTimeQuery,
  useLateOrdersQuery,
  useRestaurantPunctualityQuery,
  useOrdersByRestaurantAndTypeQuery,
  useOrdersByRestaurantAndSourceQuery,
  useOrdersDailyTrendQuery,
  useDailyTrendByRestaurantQuery,
  useInfluenceZonesQuery,
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
  formatDuration,
  formatTrend,
  truncateName,
} from "../../../../features/statistics/utils/stats-formatters";
import {
  CHART_COLORS,
  ORDER_TYPE_COLORS,
  ORDER_TYPE_LABELS,
  CHANNEL_COLORS,
  CHANNEL_LABELS,
  PUNCTUALITY_COLORS,
  AXIS_STYLE,
  GRID_STYLE,
  RESTAURANT_COLORS,
  TOOLTIP_CONTAINER_STYLE,
} from "../../../../features/statistics/utils/chart-config";
import StatsPeriodFilter from "./shared/StatsPeriodFilter";
import StatsCard from "./shared/StatsCard";
import StatsChartCard from "./shared/StatsChartCard";
import ChartTooltip, { PieChartTooltip } from "./shared/ChartTooltip";
import StatsLoadingState from "./shared/StatsLoadingState";
import StatsErrorState from "./shared/StatsErrorState";

// === Types ===
type GranularityType = "day" | "week" | "month";
type MetricType = "count" | "revenue" | "avgBasket" | "onTimeRate";


const METRIC_CONFIG: Record<MetricType, { label: string; format: (v: number) => string; yAxisFormat?: (v: number) => string }> = {
  count: {
    label: "Total Commandes",
    format: (v) => `${formatNumber(v)} cmd.`,
    yAxisFormat: (v) => formatNumber(v),
  },
  revenue: {
    label: "Chiffre d'affaires",
    format: (v) => formatCurrencyXOF(v),
    yAxisFormat: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
  },
  avgBasket: {
    label: "Panier Moyen",
    format: (v) => formatCurrencyXOF(v),
    yAxisFormat: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
  },
  onTimeRate: {
    label: "Taux Ponctualite",
    format: (v) => `${v}%`,
    yAxisFormat: (v) => `${v}%`,
  },
};

// === Stacked bar legend custom ===
function StackedBarLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// === Custom tooltip pour histogramme empile avec total ===
function StackedBarTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  metric: MetricType;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
  const formatter = METRIC_CONFIG[metric].format;

  return (
    <div style={TOOLTIP_CONTAINER_STYLE}>
      {label && (
        <p className="text-xs font-medium text-gray-900 mb-1.5">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500 flex-1 truncate max-w-[140px]">{entry.name}</span>
            <span className="font-semibold text-gray-900 whitespace-nowrap">{formatter(entry.value ?? 0)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-gray-200 flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-700">Total</span>
        <span className="font-bold text-gray-900">{formatter(total)}</span>
      </div>
    </div>
  );
}

// === Map Constants ===
const MAP_CONTAINER_STYLE = { width: "100%", borderRadius: "12px" };
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

function getRestaurantMarkerIcon(color: string, size = 32, selected = false): string {
  const s = size;
  const r = s / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${r}" cy="${r}" r="${r - 2}" fill="${color}" stroke="white" stroke-width="2"/>
    ${selected ? `<circle cx="${r}" cy="${r}" r="${r - 6}" fill="white" fill-opacity="0.4"/>` : ""}
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function StatsOrders() {
  const [filters, setFilters] = useState<StatsFilters>({
    ...DEFAULT_STATS_FILTERS,
    restaurantId: undefined,
  });
  const [granularity, setGranularity] = useState<GranularityType>("day");
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("count");
  const [fullScreenInfluence, setFullScreenInfluence] = useState(false);
  const [selectedInfluenceRestaurant, setSelectedInfluenceRestaurant] = useState<string | null>(null);
  const queryParams = {
    ...filters,
    restaurantId: filters.restaurantId ?? undefined,
  };

  // ---- Queries ----
  const overview = useOrdersOverviewQuery(queryParams);
  const byChannel = useOrdersByChannelQuery(queryParams);
  const processingTime = useOrdersProcessingTimeQuery(queryParams);
  const lateOrders = useLateOrdersQuery(queryParams);
  const restoPunctuality = useRestaurantPunctualityQuery(queryParams);
  const byRestaurantAndType = useOrdersByRestaurantAndTypeQuery(queryParams);
  const byRestaurantAndSource = useOrdersByRestaurantAndSourceQuery(queryParams);
  const dailyTrend = useOrdersDailyTrendQuery({ ...queryParams, granularity });
  const trendByRestaurant = useDailyTrendByRestaurantQuery({ ...queryParams, granularity });
  const influenceZones = useInfluenceZonesQuery(queryParams);
  const restaurantsLocations = useRestaurantsLocationsQuery();

  // ---- Google Maps ----
  const { isScriptLoaded: mapsLoaded } = useGoogleMaps();

  const restaurantColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const restaurants = influenceZones.data?.restaurants ?? [];
    restaurants.forEach((r, i) => {
      map.set(r.id, RESTAURANT_COLORS[i % RESTAURANT_COLORS.length]);
    });
    return map;
  }, [influenceZones.data]);

  const influenceMapPoints = useMemo(() => {
    if (!influenceZones.data?.points) return [];
    if (selectedInfluenceRestaurant) {
      return influenceZones.data.points.filter((p) => p.restaurantId === selectedInfluenceRestaurant);
    }
    return influenceZones.data.points;
  }, [influenceZones.data, selectedInfluenceRestaurant]);

  const influenceMapCenter = useMemo(() => {
    if (influenceZones.data?.center) {
      return { lat: influenceZones.data.center.lat, lng: influenceZones.data.center.lng };
    }
    return { lat: 6.3703, lng: 2.3912 };
  }, [influenceZones.data]);

  const isLoading = overview.isLoading;
  const isError = overview.isError;

  // ---- Donnees derivees ----

  // Trend CA
  const evolution = overview.data?.evolution ?? "";
  const trendData = evolution
    ? formatTrend(evolution.replace("%", ""), !evolution.startsWith("-"))
    : undefined;

  // Ponctualite livraison
  const onTimeRate = lateOrders.data ? 100 - (lateOrders.data.lateRate ?? 0) : 0;

  // Canaux
  const totalChannelOrders =
    (byChannel.data?.app?.totalOrders ?? 0) +
    (byChannel.data?.callCenter?.totalOrders ?? 0);
  const appRate =
    totalChannelOrders > 0
      ? Math.round(((byChannel.data?.app?.totalOrders ?? 0) / totalChannelOrders) * 100)
      : 0;
  const callRate = totalChannelOrders > 0 ? 100 - appRate : 0;

  // PieChart - Type de commande
  const typeChartData = (overview.data?.byType ?? []).map((t) => ({
    name: ORDER_TYPE_LABELS[t.type] ?? t.type,
    value: t.count,
    fill: ORDER_TYPE_COLORS[t.type as keyof typeof ORDER_TYPE_COLORS] ?? CHART_COLORS.textMuted,
    percentage: t.percentage,
  }));

  // PieChart - Canal
  const channelChartData = [
    {
      name: CHANNEL_LABELS.app,
      value: byChannel.data?.app?.totalOrders ?? 0,
      fill: CHANNEL_COLORS.app,
      percentage: appRate,
    },
    {
      name: CHANNEL_LABELS.callCenter,
      value: byChannel.data?.callCenter?.totalOrders ?? 0,
      fill: CHANNEL_COLORS.callCenter,
      percentage: callRate,
    },
  ];

  // PieChart - Ponctualite
  const punctualityChartData = [
    {
      name: "A l'heure",
      value: lateOrders.data?.onTimeOrders ?? 0,
      fill: PUNCTUALITY_COLORS.onTime,
      percentage: parseFloat(onTimeRate.toFixed(1)),
    },
    {
      name: "En retard",
      value: lateOrders.data?.lateOrders ?? 0,
      fill: PUNCTUALITY_COLORS.late,
      percentage: parseFloat((lateOrders.data?.lateRate ?? 0).toFixed(1)),
    },
  ];

  // BarChart Source par restaurant
  const sourceRestaurantData = (byRestaurantAndSource.data?.items ?? [])
    .slice(0, 10)
    .map((r) => ({
      name: truncateName(r.restaurantName, 25),
      fullName: r.restaurantName,
      App: r.app,
      "Call Center": r.callCenter,
      total: r.total,
    }));

  // BarChart Type par restaurant
  const stackedRestaurantData = (byRestaurantAndType.data?.items ?? [])
    .slice(0, 10)
    .map((r) => ({
      name: truncateName(r.restaurantName, 25),
      fullName: r.restaurantName,
      Livraison: r.delivery,
      Retrait: r.pickup,
      "Sur place": r.table,
      total: r.total,
    }));

  // === STACKED BAR CHART DATA ===
  const barChartRestaurants = trendByRestaurant.data?.restaurants ?? [];
  const stackedBarData = useMemo(() => {
    if (!trendByRestaurant.data) return [];
    const { restaurants, data } = trendByRestaurant.data;

    return data.map((point) => {
      const entry: Record<string, string | number> = {
        label: point.label,
        date: point.date,
      };

      for (const restaurant of restaurants) {
        const metrics = point.byRestaurant[restaurant.id];
        entry[restaurant.name] = metrics ? metrics[selectedMetric] : 0;
      }

      return entry;
    });
  }, [trendByRestaurant.data, selectedMetric]);

  // YAxis formatter
  const yAxisFormatter = useCallback(
    (value: number) => {
      return METRIC_CONFIG[selectedMetric].yAxisFormat
        ? METRIC_CONFIG[selectedMetric].yAxisFormat!(value)
        : String(value);
    },
    [selectedMetric]
  );

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Statistiques Commandes"
          subtitle="Volume, CA, canaux et performance de traitement"
          actions={[{ label: "", onClick: () => {}, customComponent: <StatsPeriodFilter filters={filters} onChange={setFilters} /> }]}
        />
      </div>

      {isLoading && <StatsLoadingState />}
      {isError && <StatsErrorState onRetry={() => overview.refetch()} />}

      {!isLoading && !isError && (
        <>
          {/* ========================================== */}
          {/* SECTION 2 : KPI Cards (cliquables)        */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Commandes"
              value={formatNumber(overview.data?.totalOrders ?? 0)}
              subtitle="sur la periode"
              trend={trendData}
              color="orange"
              onClick={() => setSelectedMetric("count")}
              active={selectedMetric === "count"}
            />
            <StatsCard
              title="Chiffre d'affaires"
              value={formatCurrencyXOF(overview.data?.totalRevenue ?? 0)}
              color="green"
              onClick={() => setSelectedMetric("revenue")}
              active={selectedMetric === "revenue"}
            />
            <StatsCard
              title="Panier Moyen"
              value={formatCurrencyXOF(overview.data?.averageBasket ?? 0)}
              color="blue"
              onClick={() => setSelectedMetric("avgBasket")}
              active={selectedMetric === "avgBasket"}
            />
            <StatsCard
              title="Taux ponctualite"
              value={`${onTimeRate.toFixed(1)}%`}
              subtitle="livraisons a l'heure"
              color={onTimeRate >= 70 ? "green" : onTimeRate >= 40 ? "orange" : "red"}
              onClick={() => setSelectedMetric("onTimeRate")}
              active={selectedMetric === "onTimeRate"}
            />
          </div>

          {/* ========================================== */}
          {/* SECTION 3 : Histogramme empile par resto   */}
          {/* ========================================== */}
          {trendByRestaurant.data && (
            <StatsChartCard
              title={`${METRIC_CONFIG[selectedMetric].label} par Restaurant`}
              icon={TrendingUp}
              rightContent={
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                  {(["day", "week", "month"] as GranularityType[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGranularity(g)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${granularity === g
                        ? "bg-white shadow-sm text-[#F17922]"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      {g === "day" ? "Jour" : g === "week" ? "Semaine" : "Mois"}
                    </button>
                  ))}
                </div>
              }
            >
              {stackedBarData.length > 0 ? (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stackedBarData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid {...GRID_STYLE} vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={AXIS_STYLE}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={AXIS_STYLE}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                          allowDecimals={false}
                          tickFormatter={yAxisFormatter}
                        />
                        <Tooltip
                          content={
                            <StackedBarTooltip metric={selectedMetric} />
                          }
                        />
                        {barChartRestaurants.map((restaurant, index) => {
                          const color = RESTAURANT_COLORS[index % RESTAURANT_COLORS.length];
                          const isLast = index === barChartRestaurants.length - 1;
                          return (
                            <Bar
                              key={restaurant.id}
                              dataKey={restaurant.name}
                              stackId="restaurant"
                              fill={color}
                              radius={isLast ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                              barSize={stackedBarData.length > 15 ? 16 : stackedBarData.length > 7 ? 24 : 32}
                            />
                          );
                        })}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <StackedBarLegend
                    items={barChartRestaurants.map((r, i) => ({
                      label: truncateName(r.name, 20),
                      color: RESTAURANT_COLORS[i % RESTAURANT_COLORS.length],
                    }))}
                  />
                </>
              ) : (
                <div className="h-80 flex items-center justify-center text-sm text-gray-400">
                  Aucune donnee disponible
                </div>
              )}
            </StatsChartCard>
          )}

          {/* ========================================== */}
          {/* SECTION 4 : Type + Canal (2 colonnes)     */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 4A - Par Type de Commande (PieChart donut) */}
            <StatsChartCard title="Par Type de Commande" icon={PieChartIcon}>
              {typeChartData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="h-55 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={typeChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {typeChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieChartTooltip valueFormatter={(v) => `${formatNumber(v)} cmd.`} />} />
                        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 text-xl font-bold">
                          {formatNumber(overview.data?.totalOrders ?? 0)}
                        </text>
                        <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-400 text-[10px]">
                          commandes
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-5 mt-2">
                    {typeChartData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span className="text-xs text-gray-600">{entry.name}</span>
                        <span className="text-xs font-semibold text-gray-900">{entry.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-55 flex items-center justify-center text-sm text-gray-400">Aucune donnee disponible</div>
              )}
            </StatsChartCard>

            {/* 4B - Par Canal (PieChart donut + details) */}
            <StatsChartCard title="Par Canal (Source)" icon={Smartphone}>
              {byChannel.data ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-55">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={channelChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {channelChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieChartTooltip valueFormatter={(v) => `${formatNumber(v)} cmd.`} />} />
                        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 text-lg font-bold">
                          {formatNumber(totalChannelOrders)}
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-400 text-[10px]">
                          total
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-3">
                    <div className="bg-orange-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#F17922] flex items-center gap-1"><Smartphone className="w-3 h-3" />App</span>
                        <span className="text-sm font-bold text-[#F17922]">{formatPercentage(appRate)}</span>
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">CA</span><span className="font-medium">{formatCurrencyXOF(byChannel.data.app?.revenue ?? 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Nouveaux</span><span className="font-medium">{formatNumber(byChannel.data.app?.newClientsOrders ?? 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Recurrents</span><span className="font-medium">{formatNumber(byChannel.data.app?.recurringClientsOrders ?? 0)}</span></div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-blue-700 flex items-center gap-1"><Phone className="w-3 h-3" />Call Center</span>
                        <span className="text-sm font-bold text-blue-700">{formatPercentage(callRate)}</span>
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">CA</span><span className="font-medium">{formatCurrencyXOF(byChannel.data.callCenter?.revenue ?? 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Nouveaux</span><span className="font-medium">{formatNumber(byChannel.data.callCenter?.newClientsOrders ?? 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Recurrents</span><span className="font-medium">{formatNumber(byChannel.data.callCenter?.recurringClientsOrders ?? 0)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-55 flex items-center justify-center text-sm text-gray-400">Aucune donnee disponible</div>
              )}
            </StatsChartCard>
          </div>

          {/* ========================================== */}
          {/* SECTION 5 : Par Restaurant (2 charts)     */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* 5A - Par Restaurant et Type */}
            {byRestaurantAndType.data && stackedRestaurantData.length > 0 && (
              <StatsChartCard
                title="Restaurants par Type de Commande"
                subtitle="Livraison, Retrait, Sur place"
                icon={Store}
              >
                <div className="h-87">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stackedRestaurantData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                      <CartesianGrid {...GRID_STYLE} horizontal={false} />
                      <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 11 }} tickLine={false} axisLine={false} width={180} />
                      <Tooltip
                        content={
                          <ChartTooltip
                            payloadLabelKey="fullName"
                            valueFormatter={(value) => `${formatNumber(value)} cmd.`}
                          />
                        }
                      />
                      <Bar dataKey="Livraison" stackId="type" fill={CHART_COLORS.primary} radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="Retrait" stackId="type" fill={CHART_COLORS.blue} radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="Sur place" stackId="type" fill={CHART_COLORS.purple} radius={[0, 4, 4, 0]} barSize={20}>
                        <LabelList dataKey="total" position="right" style={{ fontSize: 10, fill: CHART_COLORS.textSecondary, fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <StackedBarLegend items={[
                  { label: "Livraison", color: CHART_COLORS.primary },
                  { label: "Retrait", color: CHART_COLORS.blue },
                  { label: "Sur place", color: CHART_COLORS.purple },
                ]} />
              </StatsChartCard>
            )}

            {/* 5B - Par Restaurant et Source */}
            {byRestaurantAndSource.data && sourceRestaurantData.length > 0 && (
              <StatsChartCard
                title="Restaurants par Source"
                subtitle={`Top ${sourceRestaurantData.length} restaurants (App vs Call Center)`}
                icon={Smartphone}
              >
                <div className="h-87">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceRestaurantData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                      <CartesianGrid {...GRID_STYLE} horizontal={false} />
                      <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 11 }} tickLine={false} axisLine={false} width={180} />
                      <Tooltip
                        content={
                          <ChartTooltip
                            payloadLabelKey="fullName"
                            valueFormatter={(value) => `${formatNumber(value)} cmd.`}
                          />
                        }
                      />
                      <Bar dataKey="App" stackId="source" fill={CHART_COLORS.primary} radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="Call Center" stackId="source" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} barSize={20}>
                        <LabelList dataKey="total" position="right" style={{ fontSize: 10, fill: CHART_COLORS.textSecondary, fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <StackedBarLegend items={[
                  { label: "App", color: CHART_COLORS.primary },
                  { label: "Call Center", color: CHART_COLORS.blue },
                ]} />
              </StatsChartCard>
            )}

          </div>

          {/* ========================================== */}
          {/* SECTION 6 : Temps de Traitement            */}
          {/* ========================================== */}
          {processingTime.data && (
            <StatsChartCard
              title="Temps de Traitement"
              subtitle={`Base sur ${formatNumber(processingTime.data.sampleSize)} commandes (nouvelle commande -> reception client)`}
              icon={Clock}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ...(processingTime.data.byStep ?? []).map((s) => ({
                    label: s.step,
                    description: s.description,
                    avgMinutes: s.averageMinutes,
                    minMinutes: s.minMinutes,
                    maxMinutes: s.maxMinutes,
                  })),
                  {
                    label: "Total commande",
                    description: "De l'acceptation a la reception client",
                    avgMinutes: processingTime.data.averageMinutes,
                    minMinutes: processingTime.data.minMinutes,
                    maxMinutes: processingTime.data.maxMinutes,
                  },
                ].map((step) => (
                  <div key={step.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1 font-medium">{step.label}</div>
                    <div className="text-2xl font-bold text-blue-600">{formatDuration(step.avgMinutes ?? 0)}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 mb-2">moyenne</div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xs text-green-600 font-semibold">Min : {step.minMinutes ?? 0} min</span>
                      <span className="text-xs text-red-500 font-semibold">Max : {step.maxMinutes ?? 0} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </StatsChartCard>
          )}

          {/* ========================================== */}
          {/* SECTION 7 : Ponctualite Livraison + Resto  */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lateOrders.data && (
              <StatsChartCard
                title="Ponctualite des Livraisons"
                subtitle="Seuil : 40 min entre Pret et Reception (pret -> reception)"
                icon={Target}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={punctualityChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {punctualityChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieChartTooltip valueFormatter={(v) => `${formatNumber(v)} livraisons`} />} />
                        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 text-2xl font-bold">
                          {onTimeRate.toFixed(1)}%
                        </text>
                        <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-400 text-[10px]">
                          a l&apos;heure
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    <div className="flex items-center gap-2 bg-green-50 rounded-xl p-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PUNCTUALITY_COLORS.onTime }}>OK</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">A l&apos;heure</div>
                        <div className="text-[11px] text-gray-500">{formatNumber(lateOrders.data.onTimeOrders)} ({onTimeRate.toFixed(1)}%)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 rounded-xl p-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PUNCTUALITY_COLORS.late }}>!</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">En retard</div>
                        <div className="text-[11px] text-gray-500">{formatNumber(lateOrders.data.lateOrders)} ({(lateOrders.data.lateRate ?? 0).toFixed(1)}%)</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400">Retard moy.</div>
                        <div className="text-sm font-bold text-gray-800">{formatDuration(lateOrders.data.averageDelayMinutes ?? 0)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400">Retard max</div>
                        <div className="text-sm font-bold text-red-500">{formatDuration(lateOrders.data.maxDelayMinutes ?? 0)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </StatsChartCard>
            )}

            {/* 7B - Ponctualite Restaurant (accepted_at -> ready_at) */}
            {restoPunctuality.data && (
              <StatsChartCard
                title="Ponctualite Restaurant"
                subtitle="Temps de preparation (nouvelle commande -> pret)"
                icon={ChefHat}
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-gray-400">Moyenne</div>
                      <div className="text-lg font-bold text-blue-600">{formatDuration(restoPunctuality.data.averagePrepMinutes)}</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-gray-400">Min</div>
                      <div className="text-lg font-bold text-green-600">{restoPunctuality.data.minPrepMinutes} min</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-gray-400">Max</div>
                      <div className="text-lg font-bold text-red-500">{restoPunctuality.data.maxPrepMinutes} min</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-50 overflow-y-auto">
                    {(restoPunctuality.data.byRestaurant ?? []).map((r) => {
                      const barWidth = restoPunctuality.data!.maxPrepMinutes > 0
                        ? Math.round((r.averagePrepMinutes / restoPunctuality.data!.maxPrepMinutes) * 100)
                        : 0;
                      return (
                        <div key={r.restaurantId} className="flex items-center gap-2">
                          <div className="w-52 text-xs text-gray-600 truncate shrink-0">{r.restaurantName}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${barWidth}%`,
                                backgroundColor: r.averagePrepMinutes <= 15 ? CHART_COLORS.success : r.averagePrepMinutes <= 25 ? CHART_COLORS.warning : CHART_COLORS.danger,
                              }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                              {r.averagePrepMinutes} min
                            </span>
                          </div>
                          <div className="w-16 text-[10px] text-gray-400 text-right shrink-0">
                            {r.totalOrders} cmd.
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </StatsChartCard>
            )}
          </div>

          {/* ========================================== */}
          {/* SECTION : Zones d'influence restaurants    */}
          {/* ========================================== */}
          {influenceZones.data && influenceZones.data.points.length > 0 && (
            <div className={fullScreenInfluence ? "fixed inset-0 z-50 bg-white p-6 overflow-auto" : ""}>
              <StatsChartCard
                title="Zones d'influence Restaurants"
                subtitle="Répartition géographique des livraisons par restaurant"
                icon={MapIcon}
                rightContent={
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedInfluenceRestaurant ?? ""}
                      onChange={(e) => setSelectedInfluenceRestaurant(e.target.value || null)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
                    >
                      <option value="">Tous les restaurants</option>
                      {(influenceZones.data?.restaurants ?? []).map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setFullScreenInfluence(!fullScreenInfluence)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-white shadow-sm text-[#F17922]"
                    >
                      {fullScreenInfluence ? <Minimize2 className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
                    </button>
                  </div>
                }
              >
                {mapsLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{
                      ...MAP_CONTAINER_STYLE,
                      height: fullScreenInfluence ? 'calc(100vh - 200px)' : '450px',
                    }}
                    center={influenceMapCenter}
                    zoom={12}
                    options={MAP_OPTIONS}
                  >
                    {influenceMapPoints.map((point, index) => {
                      const color = restaurantColorMap.get(point.restaurantId) ?? CHART_COLORS.textMuted;
                      return (
                        <CircleF
                          key={`${point.lat}-${point.lng}-${point.restaurantId}-${index}`}
                          center={{ lat: point.lat, lng: point.lng }}
                          radius={Math.min(150 + point.count * 30, 500)}
                          options={{
                            fillColor: color,
                            fillOpacity: 0.35,
                            strokeColor: color,
                            strokeOpacity: 0.8,
                            strokeWeight: 1,
                            clickable: false,
                          }}
                        />
                      );
                    })}
                    {restaurantsLocations.data?.restaurants?.map((restaurant) => {
                      const color = restaurantColorMap.get(restaurant.id) ?? CHART_COLORS.primary;
                      const isSelected = selectedInfluenceRestaurant === restaurant.id;
                      return (
                        <MarkerF
                          key={`influence-${restaurant.id}`}
                          position={{ lat: restaurant.latitude, lng: restaurant.longitude }}
                          icon={{
                            url: getRestaurantMarkerIcon(color, isSelected ? 40 : 34),
                            scaledSize: new google.maps.Size(isSelected ? 40 : 34, isSelected ? 40 : 34),
                            anchor: new google.maps.Point(isSelected ? 20 : 17, isSelected ? 40 : 34),
                          }}
                          onClick={() => {
                            setSelectedInfluenceRestaurant(
                              selectedInfluenceRestaurant === restaurant.id ? null : restaurant.id
                            );
                          }}
                          zIndex={100}
                        />
                      );
                    })}
                  </GoogleMap>
                ) : (
                  <div className="h-50 bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-sm text-gray-400">Chargement de la carte...</div>
                  </div>
                )}
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                  {(influenceZones.data?.restaurants ?? []).map((r) => {
                    const color = restaurantColorMap.get(r.id) ?? CHART_COLORS.textMuted;
                    return (
                      <button
                        key={r.id}
                        onClick={() =>
                          setSelectedInfluenceRestaurant(
                            selectedInfluenceRestaurant === r.id ? null : r.id
                          )
                        }
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                          selectedInfluenceRestaurant === r.id
                            ? "bg-gray-200 ring-1 ring-gray-400"
                            : selectedInfluenceRestaurant
                              ? "opacity-40 hover:opacity-70"
                              : "hover:bg-gray-100"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-gray-700 font-medium">{truncateName(r.name, 18)}</span>
                      </button>
                    );
                  })}
                </div>
              </StatsChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
