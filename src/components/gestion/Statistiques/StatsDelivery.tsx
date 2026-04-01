"use client";

import React, { useState, useCallback } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import {
  Timer,
  Coins,
  MapPin,
  Truck,
  Target,
  Zap,
  Users,
} from "lucide-react";
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
  LabelList,
} from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  useDeliveryOverviewQuery,
  useDeliveryFeesBreakdownQuery,
  useDeliveryByZoneQuery,
  useDeliveryPerformanceQuery,
} from "../../../../features/statistics/queries/statistics-delivery.query";
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
} from "../../../../features/statistics/utils/stats-formatters";
import {
  CHART_COLORS,
  PUNCTUALITY_COLORS,
  AXIS_STYLE,
  GRID_STYLE,
} from "../../../../features/statistics/utils/chart-config";
import StatsPeriodFilter from "./shared/StatsPeriodFilter";
import StatsCard from "./shared/StatsCard";
import StatsChartCard from "./shared/StatsChartCard";
import ChartTooltip, { PieChartTooltip } from "./shared/ChartTooltip";
import StatsTable from "./shared/StatsTable";
import StatsLoadingState from "./shared/StatsLoadingState";
import StatsErrorState from "./shared/StatsErrorState";

// Couleurs specifiques livraison
const DELIVERY_COLORS = {
  turbo: "#8B5CF6",
  free: "#F17922",
} as const;

export default function StatsDelivery() {
  const { selectedRestaurantId } = useDashboardStore();
  const [filters, setFilters] = useState<StatsFilters>({
    ...DEFAULT_STATS_FILTERS,
    restaurantId: selectedRestaurantId ?? undefined,
  });

  const queryParams = {
    ...filters,
    restaurantId: filters.restaurantId ?? selectedRestaurantId ?? undefined,
  };

  // ---- Queries ----
  const overview = useDeliveryOverviewQuery(queryParams);
  const feesBreakdown = useDeliveryFeesBreakdownQuery(queryParams);
  const byZone = useDeliveryByZoneQuery({ ...queryParams, limit: 10 });
  const performance = useDeliveryPerformanceQuery(queryParams);

  const isLoading = overview.isLoading || performance.isLoading;
  const isError = overview.isError && performance.isError;

  // ---- Donnees derivees ----

  // Trend evolution
  const evolution = overview.data?.evolution ?? "";
  const trendData = evolution
    ? formatTrend(evolution.replace("%", ""), !evolution.startsWith("-"))
    : undefined;

  // PieChart Turbo vs Free
  const totalDeliveries = overview.data?.totalDeliveries ?? 0;
  const serviceChartData = [
    {
      name: "Turbo",
      value: overview.data?.turboCount ?? 0,
      fill: DELIVERY_COLORS.turbo,
      percentage: overview.data?.turboPercentage ?? 0,
    },
    {
      name: "Interne (Free)",
      value: overview.data?.freeCount ?? 0,
      fill: DELIVERY_COLORS.free,
      percentage: overview.data?.freePercentage ?? 0,
    },
  ];

  // PieChart Ponctualite
  const onTimeRate = performance.data?.onTimeRate ?? 0;
  const lateRate = 100 - onTimeRate;
  const punctualityChartData = [
    {
      name: "A l'heure",
      value: performance.data?.onTimeOrders ?? 0,
      fill: PUNCTUALITY_COLORS.onTime,
      percentage: onTimeRate,
    },
    {
      name: "En retard",
      value: performance.data?.lateOrders ?? 0,
      fill: PUNCTUALITY_COLORS.late,
      percentage: parseFloat(lateRate.toFixed(1)),
    },
  ];

  // BarChart Frais
  const feesBarData = (feesBreakdown.data?.breakdown ?? []).map((item) => ({
    name: item.label,
    commandes: item.orderCount,
    frais: item.deliveryFeesCollected,
    percentage: item.percentage,
  }));

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Statistiques Livraison"
          subtitle="Performance, frais et zones de livraison"
          actions={[{ label: "", onClick: () => {}, customComponent: <StatsPeriodFilter filters={filters} onChange={setFilters} /> }]}
        />
      </div>

      {isLoading && <StatsLoadingState />}
      {isError && (
        <StatsErrorState
          onRetry={() => {
            overview.refetch();
            performance.refetch();
          }}
        />
      )}

      {!isLoading && !isError && (
        <>
          {/* ========================================== */}
          {/* SECTION 2 : KPI Cards                     */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Commandes livraison"
              value={formatNumber(overview.data?.totalDeliveries ?? 0)}
              subtitle="sur la periode"
              trend={trendData}
              color="orange"
            />
            <StatsCard
              title="CA Livraison"
              value={formatCurrencyXOF(overview.data?.totalRevenue ?? 0)}
              subtitle="revenu total"
              color="green"
            />
            <StatsCard
              title="Frais collectes"
              value={formatCurrencyXOF(overview.data?.totalFeesCollected ?? 0)}
              subtitle="frais de livraison"
              color="blue"
            />
            <StatsCard
              title="Frais moyen"
              value={formatCurrencyXOF(overview.data?.averageFee ?? 0)}
              subtitle="par commande"
              color="purple"
            />
          </div>

          {/* ========================================== */}
          {/* SECTION 3 : Service + Ponctualite (2 col) */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 3A - Repartition Turbo vs Free (PieChart donut + details) */}
            <StatsChartCard
              title="Type de Service"
              subtitle="Turbo (externe) vs Interne (Free)"
              icon={Truck}
            >
              {totalDeliveries > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-55">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={serviceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={82}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {serviceChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <PieChartTooltip
                              valueFormatter={(v) =>
                                `${formatNumber(v)} livraisons`
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
                          {formatNumber(totalDeliveries)}
                        </text>
                        <text
                          x="50%"
                          y="57%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-gray-400 text-[10px]"
                        >
                          livraisons
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-3">
                    {/* Turbo */}
                    <div className="bg-purple-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Turbo
                        </span>
                        <span className="text-sm font-bold text-purple-700">
                          {formatPercentage(
                            overview.data?.turboPercentage ?? 0
                          )}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Livraisons</span>
                          <span className="font-medium">
                            {formatNumber(overview.data?.turboCount ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Free / Interne */}
                    <div className="bg-orange-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#F17922] flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Interne (Free)
                        </span>
                        <span className="text-sm font-bold text-[#F17922]">
                          {formatPercentage(
                            overview.data?.freePercentage ?? 0
                          )}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Livraisons</span>
                          <span className="font-medium">
                            {formatNumber(overview.data?.freeCount ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-55 flex items-center justify-center text-sm text-gray-400">
                  Aucune donnee disponible
                </div>
              )}
            </StatsChartCard>

            {/* 3B - Ponctualite de Livraison (PieChart donut + stats) */}
            {performance.data && (
              <StatsChartCard
                title="Ponctualite de Livraison"
                subtitle="Seuil : 40 min entre Pret et Reception client"
                icon={Target}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={punctualityChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={82}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {punctualityChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <PieChartTooltip
                              valueFormatter={(v) =>
                                `${formatNumber(v)} livraisons`
                              }
                            />
                          }
                        />
                        <text
                          x="50%"
                          y="44%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-gray-900 text-2xl font-bold"
                        >
                          {onTimeRate.toFixed(1)}%
                        </text>
                        <text
                          x="50%"
                          y="57%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-gray-400 text-[10px]"
                        >
                          a l&apos;heure
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    <div className="flex items-center gap-2 bg-green-50 rounded-xl p-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{
                          backgroundColor: PUNCTUALITY_COLORS.onTime,
                        }}
                      >
                        OK
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">
                          A l&apos;heure
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {formatNumber(performance.data.onTimeOrders)} (
                          {onTimeRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 rounded-xl p-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: PUNCTUALITY_COLORS.late }}
                      >
                        !
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">
                          En retard
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {formatNumber(performance.data.lateOrders)} (
                          {lateRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400">
                          Retard moy.
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                          {formatDuration(
                            performance.data.averageDelayMinutes ?? 0
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400">
                          Retard max
                        </div>
                        <div className="text-sm font-bold text-red-500">
                          {formatDuration(
                            performance.data.maxDelayMinutes ?? 0
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </StatsChartCard>
            )}
          </div>

          {/* ========================================== */}
          {/* SECTION 4 : Performance Livraison         */}
          {/* ========================================== */}
          {performance.data && (
            <StatsChartCard
              title="Performance de Livraison"
              subtitle="Temps entre commande prete et reception client"
              icon={Timer}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1 font-medium">
                    Temps moyen
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(
                      performance.data.averageDeliveryMinutes ?? 0
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Pret → Reception
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1 font-medium">
                    Temps min
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatDuration(
                      performance.data.minDeliveryMinutes ?? 0
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    meilleur temps
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1 font-medium">
                    Temps max
                  </div>
                  <div className="text-2xl font-bold text-red-500">
                    {formatDuration(
                      performance.data.maxDeliveryMinutes ?? 0
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    plus long
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1 font-medium">
                    Taux ponctualite
                  </div>
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color:
                        onTimeRate >= 70
                          ? CHART_COLORS.success
                          : onTimeRate >= 40
                          ? CHART_COLORS.warning
                          : CHART_COLORS.danger,
                    }}
                  >
                    {onTimeRate.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    seuil 40 min
                  </div>
                </div>
              </div>
            </StatsChartCard>
          )}

          {/* ========================================== */}
          {/* SECTION 5 : Frais de Livraison (BarChart) */}
          {/* ========================================== */}
          {feesBreakdown.data &&
            feesBreakdown.data.breakdown &&
            feesBreakdown.data.breakdown.length > 0 && (
              <StatsChartCard
                title="Repartition des Frais de Livraison"
                subtitle={`Total collecte : ${formatCurrencyXOF(feesBreakdown.data.totalDeliveryFees ?? 0)}`}
                icon={Coins}
              >
                <div
                  style={{
                    height: Math.max(250, feesBarData.length * 45),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={feesBarData}
                      layout="vertical"
                      margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid {...GRID_STYLE} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={AXIS_STYLE}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ ...AXIS_STYLE, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={120}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip
                            valueFormatter={(value, name) => {
                              if (name === "Commandes")
                                return `${formatNumber(value)} cmd.`;
                              if (name === "Frais collectes")
                                return formatCurrencyXOF(value);
                              return formatNumber(value);
                            }}
                          />
                        }
                      />
                      <Bar
                        dataKey="commandes"
                        name="Commandes"
                        fill={CHART_COLORS.primary}
                        radius={[0, 4, 4, 0]}
                        barSize={22}
                      >
                        <LabelList
                          dataKey="commandes"
                          position="right"
                          style={{
                            fontSize: 10,
                            fill: CHART_COLORS.textSecondary,
                            fontWeight: 600,
                          }}
                          formatter={(v: number) => `${v} cmd.`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Resume total */}
                <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Total frais :{" "}
                    <span className="font-semibold text-gray-900">
                      {formatCurrencyXOF(
                        feesBreakdown.data.totalDeliveryFees ?? 0
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    CA livraison :{" "}
                    <span className="font-semibold text-gray-900">
                      {formatCurrencyXOF(
                        feesBreakdown.data.totalDeliveryRevenue ?? 0
                      )}
                    </span>
                  </div>
                </div>
              </StatsChartCard>
            )}

          {/* ========================================== */}
          {/* SECTION 6 : Top Zones de Livraison        */}
          {/* ========================================== */}
          {byZone.data && (byZone.data.items?.length ?? 0) > 0 && (
            <StatsChartCard
              title="Top Zones de Livraison"
              subtitle={`${formatNumber(byZone.data.totalDeliveries)} livraisons au total`}
              icon={MapPin}
            >
              <StatsTable
                columns={[
                  { key: "rank", label: "#", width: "40px" },
                  { key: "zone", label: "Zone" },
                  {
                    key: "orderCount",
                    label: "Commandes",
                    align: "right" as const,
                  },
                  {
                    key: "revenue",
                    label: "CA",
                    align: "right" as const,
                  },
                  {
                    key: "percentage",
                    label: "Part",
                    align: "right" as const,
                  },
                ]}
                rows={(byZone.data.items ?? []).map((z, i) => ({
                  rank: (
                    <span className="font-bold text-[#F17922]">#{i + 1}</span>
                  ),
                  zone: (
                    <span className="font-medium text-gray-800">{z.zone}</span>
                  ),
                  orderCount: (
                    <span className="font-semibold">
                      {formatNumber(z.orderCount)}
                    </span>
                  ),
                  revenue: (
                    <span className="text-green-700 font-medium">
                      {z.revenueFormatted}
                    </span>
                  ),
                  percentage: (
                    <span className="bg-orange-50 text-[#F17922] px-2 py-0.5 rounded-full text-xs font-medium">
                      {formatPercentage(z.percentage)}
                    </span>
                  ),
                }))}
              />
            </StatsChartCard>
          )}
        </>
      )}
    </div>
  );
}
