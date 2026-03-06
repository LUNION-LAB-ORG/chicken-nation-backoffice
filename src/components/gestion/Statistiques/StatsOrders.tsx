"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  TrendingUp,
  Smartphone,
  Phone,
  Clock,
  Target,
  Store,
  ChefHat,
  MapPin,
  PieChart as PieChartIcon,
  Minimize2,
  Fullscreen,
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
  Legend,
  LabelList,
} from "recharts";
import { GoogleMap, HeatmapLayerF } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
  useOrdersOverviewQuery,
  useOrdersByChannelQuery,
  useOrdersProcessingTimeQuery,
  useLateOrdersQuery,
  useRestaurantPunctualityQuery,
  useOrdersByRestaurantAndTypeQuery,
  useOrdersByRestaurantAndSourceQuery,
  useOrdersDailyTrendQuery,
  useClientZonesQuery,
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
  getPerformanceColor,
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
  AREA_GRADIENT_ID,
  AREA_GRADIENT_CONFIG,
} from "../../../../features/statistics/utils/chart-config";
import StatsPeriodFilter from "./shared/StatsPeriodFilter";
import StatsCard from "./shared/StatsCard";
import StatsChartCard from "./shared/StatsChartCard";
import ChartTooltip, { PieChartTooltip } from "./shared/ChartTooltip";
import StatsLoadingState from "./shared/StatsLoadingState";
import StatsErrorState from "./shared/StatsErrorState";

type GranularityType = "day" | "week" | "month";

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

// === Stacked bar legend custom ===
function StackedBarLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-5 mt-2">
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

export default function StatsOrders() {
  const [filters, setFilters] = useState<StatsFilters>({
    ...DEFAULT_STATS_FILTERS,
    restaurantId: undefined,
  });
  const [granularity, setGranularity] = useState<GranularityType>("day");

  const queryParams = {
    ...filters,
    restaurantId: filters.restaurantId ?? undefined,
  };
  const [fullScreen, setFullScreen] = useState(false);
  // ---- Queries ----
  const overview = useOrdersOverviewQuery(queryParams);
  const byChannel = useOrdersByChannelQuery(queryParams);
  const processingTime = useOrdersProcessingTimeQuery(queryParams);
  const lateOrders = useLateOrdersQuery(queryParams);
  const restoPunctuality = useRestaurantPunctualityQuery(queryParams);
  const byRestaurantAndType = useOrdersByRestaurantAndTypeQuery(queryParams);
  const byRestaurantAndSource = useOrdersByRestaurantAndSourceQuery(queryParams);
  const dailyTrend = useOrdersDailyTrendQuery({ ...queryParams, granularity });
  const clientZones = useClientZonesQuery(queryParams);

  const isLoading = overview.isLoading;
  const isError = overview.isError;

  // ---- Google Maps (chargé globalement via GoogleMapsProvider avec visualization) ----
  const { isScriptLoaded: mapsLoaded } = useGoogleMaps();

  // ---- Données dérivées ----

  // Trend CA
  const evolution = overview.data?.evolution ?? "";
  const trendData = evolution
    ? formatTrend(evolution.replace("%", ""), !evolution.startsWith("-"))
    : undefined;

  // Ponctualité livraison
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

  // Données PieChart - Type de commande
  const typeChartData = (overview.data?.byType ?? []).map((t) => ({
    name: ORDER_TYPE_LABELS[t.type] ?? t.type,
    value: t.count,
    fill: ORDER_TYPE_COLORS[t.type as keyof typeof ORDER_TYPE_COLORS] ?? CHART_COLORS.textMuted,
    percentage: t.percentage,
  }));

  // Données PieChart - Canal
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

  // Données PieChart - Ponctualité livraison
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

  // Données BarChart Empilé Horizontal - Par Restaurant et Source (App / Call Center)
  const sourceRestaurantData = (byRestaurantAndSource.data?.items ?? [])
    .slice(0, 10)
    .map((r) => ({
      name: truncateName(r.restaurantName, 25),
      fullName: r.restaurantName,
      App: r.app,
      "Call Center": r.callCenter,
      total: r.total,
    }));

  // Données BarChart Empilé Horizontal - Par Restaurant et Type
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

  // Heat map data
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
    return { lat: 6.3703, lng: 2.3912 }; // Cotonou par défaut
  }, [clientZones.data]);

  // Formatters tooltip
  const trendTooltipFormatter = useCallback(
    (value: number, name: string) => {
      if (name === "Commandes") return `${formatNumber(value)} cmd.`;
      return formatCurrencyXOF(value);
    },
    []
  );

  return (
    <div className="space-y-6 p-6">
      {/* ========================================== */}
      {/* SECTION 1 : En-tete + Filtres             */}
      {/* ========================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques Commandes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Volume, CA, canaux et performance de traitement
          </p>
        </div>
        <StatsPeriodFilter filters={filters} onChange={setFilters} />
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
              title="Total Commandes"
              value={formatNumber(overview.data?.totalOrders ?? 0)}
              subtitle="sur la periode"
              trend={trendData}
              color="orange"
            />
            <StatsCard
              title="Chiffre d'affaires"
              value={formatCurrencyXOF(overview.data?.totalRevenue ?? 0)}
              color="green"
            />
            <StatsCard
              title="Panier Moyen"
              value={formatCurrencyXOF(overview.data?.averageBasket ?? 0)}
              color="blue"
            />
            <StatsCard
              title="Taux ponctualite"
              value={`${onTimeRate.toFixed(1)}%`}
              subtitle="livraisons a l'heure"
              color={onTimeRate >= 70 ? "green" : onTimeRate >= 40 ? "orange" : "red"}
            />
          </div>

          {/* ========================================== */}
          {/* SECTION 3 : Tendance des Commandes - Area */}
          {/* ========================================== */}
          {dailyTrend.data && (
            <StatsChartCard
              title="Tendance des Commandes"
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
              <div className="h-50">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailyTrend.data.data ?? []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={AREA_GRADIENT_CONFIG.startColor} stopOpacity={AREA_GRADIENT_CONFIG.startOpacity} />
                        <stop offset="95%" stopColor={AREA_GRADIENT_CONFIG.endColor} stopOpacity={AREA_GRADIENT_CONFIG.endOpacity} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID_STYLE} vertical={false} />
                    <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip valueFormatter={trendTooltipFormatter} />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Commandes"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2.5}
                      fill={`url(#${AREA_GRADIENT_ID})`}
                      dot={false}
                      activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Total : <span className="font-semibold text-gray-900">{formatNumber(dailyTrend.data.totalOrders)} cmd.</span>
                </div>
                <div className="text-xs text-gray-500">
                  CA : <span className="font-semibold text-gray-900">{formatCurrencyXOF(dailyTrend.data.totalRevenue)}</span>
                </div>
              </div>
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
            {/* 5A - Histogramme horizontal empilé par restaurant et source (App / Call Center) */}
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

            {/* 5B - Histogramme horizontal empilé par restaurant et type */}
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
                subtitle="Seuil : 40 min entre Pret et Reception (prêt -> réception)"
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
                          a l'heure
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    <div className="flex items-center gap-2 bg-green-50 rounded-xl p-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PUNCTUALITY_COLORS.onTime }}>OK</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">A l'heure</div>
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
                subtitle="Temps de preparation (nouvelle commande -> prêt)"
                icon={ChefHat}
              >
                <div className="space-y-3">
                  {/* Resume global */}
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
                  {/* Par restaurant */}
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
          {/* SECTION 8 : Zones Clients (Heat Map)      */} {/* ========================================== */}
          {clientZones.data && clientZones.data.points.length > 0 && (
            <StatsChartCard
              title="Zones Clients"
              subtitle={`${formatNumber(clientZones.data.totalPoints)} zones identifiees sur ${formatNumber(clientZones.data.totalOrders)} commandes livrees`}
              icon={MapPin}
              rightContent={
                <button
                  onClick={() => setFullScreen(!fullScreen)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-white shadow-sm text-[#F17922]"
                >
                  {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
                </button>
              }
            >
              {mapsLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ ...MAP_CONTAINER_STYLE, height: fullScreen ? `${window.innerHeight - 200}px` : '400px' }}
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
                </GoogleMap>
              ) : (
                <div className="h-50 bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-sm text-gray-400">Chargement de la carte...</div>
                </div>
              )}
              {/* Legende heat map */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
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
              </div>
            </StatsChartCard>
          )}
        </>
      )}
    </div>
  );
}
