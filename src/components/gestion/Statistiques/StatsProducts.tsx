"use client";

import React, { useState } from "react";
import {
  Trophy,
  FolderOpen,
  Store,
  TrendingUp,
  Smartphone,
  Phone,
  Tag,
  ShoppingBasket,
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
  Legend,
} from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  useTopProductsQuery,
  useTopCategoriesQuery,
  useProductsByRestaurantQuery,
  useSalesTrendQuery,
  useChannelBreakdownQuery,
  usePromotionPerformanceQuery,
} from "../../../../features/statistics/queries/statistics-products.query";
import {
  StatsFilters,
  DEFAULT_STATS_FILTERS,
} from "../../../../features/statistics/filters/statistics.filters";
import {
  formatCurrencyXOF,
  formatNumber,
  formatPercentage,
  truncateName,
  formatTrend,
} from "../../../../features/statistics/utils/stats-formatters";
import {
  CHART_COLORS,
  AXIS_STYLE,
  GRID_STYLE,
  CHANNEL_COLORS,
} from "../../../../features/statistics/utils/chart-config";
import StatsPeriodFilter from "./shared/StatsPeriodFilter";
import StatsCard from "./shared/StatsCard";
import StatsChartCard from "./shared/StatsChartCard";
import ChartTooltip, { PieChartTooltip } from "./shared/ChartTooltip";
import StatsTable from "./shared/StatsTable";
import StatsLoadingState from "./shared/StatsLoadingState";
import StatsErrorState from "./shared/StatsErrorState";
import { formatImageUrl } from "@/utils/imageHelpers";

// Couleurs catégories (palette variée)
const CATEGORY_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  "#14B8A6",
  "#EC4899",
  "#F59E0B",
  CHART_COLORS.secondary,
  CHART_COLORS.success,
];

export default function StatsProducts() {
  const { selectedRestaurantId } = useDashboardStore();
  const [filters, setFilters] = useState<StatsFilters>({
    ...DEFAULT_STATS_FILTERS,
    restaurantId: selectedRestaurantId ?? undefined,
  });

  const queryParams = {
    ...filters,
    restaurantId: filters.restaurantId ?? selectedRestaurantId ?? undefined,
  };

  // ---- Queries existantes ----
  const topProducts = useTopProductsQuery({ ...queryParams, limit: 10 });
  const topCategories = useTopCategoriesQuery({ ...queryParams, limit: 8 });
  const byRestaurant = useProductsByRestaurantQuery(queryParams);

  // ---- Nouvelles queries ----
  const salesTrend = useSalesTrendQuery(queryParams);
  const channelBreakdown = useChannelBreakdownQuery(queryParams);
  const promotionPerf = usePromotionPerformanceQuery(queryParams);

  const isLoading = topProducts.isLoading;
  const isError = topProducts.isError;

  // ---- Donnees globales (salesTrend agrège TOUS les produits, pas juste le top 10) ----
  const globalTotalSold = salesTrend.data?.totalQuantity ?? 0;
  const globalTotalRevenue = salesTrend.data?.totalRevenue ?? 0;
  const globalAvgPerDish =
    globalTotalSold > 0 ? Math.round(globalTotalRevenue / globalTotalSold) : 0;

  // ---- Top 10 données pour le BarChart/table ----
  const topTotalSold = topProducts.data?.totalSold ?? 0;

  // ---- PieChart catégories ----
  const categoryChartData = (topCategories.data?.items ?? []).map(
    (cat, i) => ({
      name: cat.name,
      value: cat.revenue,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      percentage: cat.percentage,
      totalSold: cat.totalSold,
      dishCount: cat.dishCount,
    })
  );

  // ---- PieChart canal ----
  const channelData = channelBreakdown.data;
  const channelChartData = channelData
    ? [
        {
          name: "Application",
          value: channelData.appSold,
          fill: CHART_COLORS.primary,
          percentage: channelData.appPercentage,
        },
        {
          name: "Call Center",
          value: channelData.callCenterSold,
          fill: CHART_COLORS.blue,
          percentage: channelData.callCenterPercentage,
        },
      ]
    : [];

  // ---- BarChart top produits (empilé par source) ----
  const topProductsBarData = (topProducts.data?.items ?? [])
    .slice(0, 10)
    .map((item) => ({
      name: truncateName(item.name, 20),
      fullName: item.name,
      totalSold: item.totalSold,
      revenue: item.revenue,
      percentage: item.percentage,
      app: item.sourceBreakdown?.app ?? item.totalSold,
      callCenter: item.sourceBreakdown?.callCenter ?? 0,
      hubrise: item.sourceBreakdown?.hubrise ?? 0,
    }));

  return (
    <div className="space-y-6 p-6">
      {/* ========================================== */}
      {/* SECTION 1 : En-tete + Filtres             */}
      {/* ========================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Produits &amp; Catégories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyse des performances des plats et catégories
          </p>
        </div>
        <StatsPeriodFilter filters={filters} onChange={setFilters} />
      </div>

      {isLoading && <StatsLoadingState />}
      {isError && (
        <StatsErrorState
          onRetry={() => {
            topProducts.refetch();
            topCategories.refetch();
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
              title="Plats vendus"
              value={formatNumber(globalTotalSold)}
              subtitle="tous produits confondus"
              color="orange"
            />
            <StatsCard
              title="CA Produits"
              value={formatCurrencyXOF(globalTotalRevenue)}
              subtitle="chiffre d'affaires global"
              color="green"
            />
            <StatsCard
              title="Plats distincts"
              value={formatNumber(
                topProducts.data?.uniqueDishesCount ?? 0
              )}
              subtitle="plats différents vendus"
              color="blue"
            />
            <StatsCard
              title="Prix moyen / plat"
              value={formatCurrencyXOF(globalAvgPerDish)}
              subtitle="revenu moyen par unité"
              color="purple"
            />
          </div>

          {/* ========================================== */}
          {/* SECTION 3 : Tendance des ventes (AreaChart)*/}
          {/* ========================================== */}
          {salesTrend.data &&
            salesTrend.data.dailyData &&
            salesTrend.data.dailyData.length > 0 && (
              <StatsChartCard
                title="Tendance des Ventes"
                subtitle={`${formatNumber(salesTrend.data.totalQuantity)} plats vendus · CA ${formatCurrencyXOF(salesTrend.data.totalRevenue)}`}
                icon={TrendingUp}
              >
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={salesTrend.data.dailyData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="gradQuantity"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={CHART_COLORS.primary}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={CHART_COLORS.primary}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gradRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={CHART_COLORS.success}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={CHART_COLORS.success}
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
                        yAxisId="qty"
                        tick={AXIS_STYLE}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="rev"
                        orientation="right"
                        tick={AXIS_STYLE}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          v >= 1000
                            ? `${Math.round(v / 1000)}k`
                            : String(v)
                        }
                      />
                      <Tooltip
                        content={
                          <ChartTooltip
                            valueFormatter={(v, name) => {
                              if (name === "CA")
                                return formatCurrencyXOF(v);
                              return `${formatNumber(v)} plats`;
                            }}
                          />
                        }
                      />
                      <Area
                        yAxisId="qty"
                        type="monotone"
                        dataKey="totalQuantity"
                        name="Quantité"
                        stroke={CHART_COLORS.primary}
                        fill="url(#gradQuantity)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        yAxisId="rev"
                        type="monotone"
                        dataKey="totalRevenue"
                        name="CA"
                        stroke={CHART_COLORS.success}
                        fill="url(#gradRevenue)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Légende */}
                <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className="w-3 h-0.5 rounded"
                      style={{
                        backgroundColor: CHART_COLORS.primary,
                      }}
                    />
                    Quantité vendue
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className="w-3 h-0.5 rounded"
                      style={{
                        backgroundColor: CHART_COLORS.success,
                      }}
                    />
                    Chiffre d&apos;affaires
                  </div>
                </div>
              </StatsChartCard>
            )}

          {/* ========================================== */}
          {/* SECTION 4 : Top 10 Produits (BarChart)     */}
          {/* ========================================== */}
          {topProductsBarData.length > 0 && (
            <StatsChartCard
              title="Top 10 Plats les plus vendus"
              subtitle={`${formatNumber(topTotalSold)} plats dans le top 10 · ${formatNumber(globalTotalSold)} au total`}
              icon={Trophy}
            >
              <div
                style={{
                  height: Math.max(320, topProductsBarData.length * 42),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 70, left: 10, bottom: 20 }}
                    stackOffset="none"
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
                      width={140}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          payloadLabelKey="fullName"
                          valueFormatter={(v, name) =>
                            `${formatNumber(v)} plats`
                          }
                        />
                      }
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                    {/* Barre empilée : App (orange) */}
                    <Bar
                      dataKey="app"
                      name="App"
                      stackId="source"
                      fill={CHANNEL_COLORS.app}
                      barSize={24}
                    />
                    {/* Barre empilée : Call Center (bleu) */}
                    <Bar
                      dataKey="callCenter"
                      name="Call Center"
                      stackId="source"
                      fill={CHANNEL_COLORS.callCenter}
                      barSize={24}
                    />
                    {/* Barre empilée : HubRise (violet) — dernier = bord arrondi droit */}
                    {/* <Bar
                      dataKey="hubrise"
                      name="HubRise"
                      stackId="source"
                      fill={CHART_COLORS.purple}
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                    >
                      <LabelList
                        dataKey="totalSold"
                        position="right"
                        style={{
                          fontSize: 10,
                          fill: CHART_COLORS.textSecondary,
                          fontWeight: 600,
                        }}
                        formatter={(v: number) => `${v} plats`}
                      />
                    </Bar> */}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table détaillée en dessous */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <StatsTable
                  columns={[
                    { key: "rank", label: "#", width: "35px" },
                    { key: "dish", label: "Plat" },
                    { key: "category", label: "Catégorie" },
                    {
                      key: "sold",
                      label: "Vendus",
                      align: "right" as const,
                    },
                    {
                      key: "revenue",
                      label: "CA",
                      align: "right" as const,
                    },
                    {
                      key: "evolution",
                      label: "Évolution",
                      align: "right" as const,
                    },
                  ]}
                  rows={(topProducts.data?.items ?? []).map((item, i) => {
                    const evo = item.evolution;
                    const isPositive = evo
                      ? !evo.startsWith("-") && evo !== "0.0%"
                      : false;
                    return {
                      rank: (
                        <span className="font-bold text-[#F17922]">
                          #{i + 1}
                        </span>
                      ),
                      dish: (
                        <div className="flex items-center gap-2">
                          {item.image && (
                            <img
                              src={formatImageUrl(item.image)}
                              alt={item.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          )}
                          <span className="font-medium text-gray-800">
                            {truncateName(item.name)}
                          </span>
                        </div>
                      ),
                      category: (
                        <span className="text-gray-500 text-sm">
                          {item.categoryName}
                        </span>
                      ),
                      sold: (
                        <span className="font-semibold">
                          {formatNumber(item.totalSold)}
                        </span>
                      ),
                      revenue: (
                        <span className="text-green-700 font-medium">
                          {formatCurrencyXOF(item.revenue)}
                        </span>
                      ),
                      evolution: evo ? (
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: isPositive
                              ? CHART_COLORS.success
                              : evo === "0.0%"
                              ? CHART_COLORS.textMuted
                              : CHART_COLORS.danger,
                          }}
                        >
                          {isPositive ? "↑" : evo === "0.0%" ? "" : "↓"}{" "}
                          {evo}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      ),
                    };
                  })}
                />
              </div>
            </StatsChartCard>
          )}

          {/* ========================================== */}
          {/* SECTION 5 : Catégories (PieChart + détails)*/}
          {/* ========================================== */}
          {categoryChartData.length > 0 && (
            <StatsChartCard
              title="Répartition par Catégorie"
              subtitle={`${formatNumber(topCategories.data?.totalSold ?? 0)} plats vendus`}
              icon={FolderOpen}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PieChart donut */}
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={
                          <PieChartTooltip
                            valueFormatter={(v) => formatCurrencyXOF(v)}
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
                        {categoryChartData.length}
                      </text>
                      <text
                        x="50%"
                        y="56%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-gray-400 text-[10px]"
                      >
                        catégories
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Détails par catégorie */}
                <div className="space-y-2 overflow-y-auto max-h-72">
                  {(topCategories.data?.items ?? []).map((cat, i) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50"
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {cat.name}
                          </span>
                          <span
                            className="text-xs font-bold ml-2"
                            style={{
                              color:
                                CATEGORY_COLORS[
                                  i % CATEGORY_COLORS.length
                                ],
                            }}
                          >
                            {formatPercentage(cat.percentage)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                          <span>
                            {formatNumber(cat.totalSold)} vendus ·{" "}
                            {cat.dishCount} plats
                          </span>
                          <span className="font-medium text-green-700">
                            {formatCurrencyXOF(cat.revenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </StatsChartCard>
          )}

          {/* ========================================== */}
          {/* SECTION 6 : Canal + Promos (2 cols)        */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 6A - Canal de vente */}
            {channelData && channelData.totalSold > 0 && (
              <StatsChartCard
                title="Canal de Vente"
                subtitle={`${formatNumber(channelData.totalSold)} plats vendus`}
                icon={Smartphone}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-55">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={82}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {channelChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <PieChartTooltip
                              valueFormatter={(v) =>
                                `${formatNumber(v)} plats`
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
                          {formatNumber(channelData.totalSold)}
                        </text>
                        <text
                          x="50%"
                          y="57%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-gray-400 text-[10px]"
                        >
                          plats vendus
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-3">
                    {/* App */}
                    <div className="bg-orange-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#F17922] flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          App Mobile
                        </span>
                        <span className="text-sm font-bold text-[#F17922]">
                          {formatPercentage(channelData.appPercentage)}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[10px] text-gray-500">
                        <div className="flex justify-between">
                          <span>Plats vendus</span>
                          <span className="font-medium">
                            {formatNumber(channelData.appSold)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>CA</span>
                          <span className="font-medium">
                            {formatCurrencyXOF(channelData.appRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Call Center */}
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Call Center
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          {formatPercentage(
                            channelData.callCenterPercentage
                          )}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[10px] text-gray-500">
                        <div className="flex justify-between">
                          <span>Plats vendus</span>
                          <span className="font-medium">
                            {formatNumber(channelData.callCenterSold)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>CA</span>
                          <span className="font-medium">
                            {formatCurrencyXOF(
                              channelData.callCenterRevenue
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </StatsChartCard>
            )}

            {/* 6B - Performance des Promotions */}
            {promotionPerf.data && (
              <StatsChartCard
                title="Promotions vs Réguliers"
                subtitle={`${formatPercentage(promotionPerf.data.promoRevenueShare)} du CA vient des promos`}
                icon={Tag}
              >
                <div className="space-y-4">
                  {/* Barre promo */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#F17922] flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        En promotion
                      </span>
                      <span className="text-sm font-bold text-[#F17922]">
                        {formatCurrencyXOF(promotionPerf.data.promoRevenue)}
                      </span>
                    </div>
                    <div className="w-full bg-orange-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: CHART_COLORS.primary,
                          width: `${promotionPerf.data.promoRevenueShare}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                      <span>
                        {promotionPerf.data.promoDishCount} plats ·{" "}
                        {formatNumber(promotionPerf.data.promoTotalSold)}{" "}
                        vendus
                      </span>
                      <span>
                        Moy.{" "}
                        {formatCurrencyXOF(
                          promotionPerf.data.promoAvgBasket
                        )}
                        /plat
                      </span>
                    </div>
                  </div>
                  {/* Barre régulier */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                        <ShoppingBasket className="w-3 h-3" />
                        Réguliers
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        {formatCurrencyXOF(
                          promotionPerf.data.regularRevenue
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: CHART_COLORS.blue,
                          width: `${100 - promotionPerf.data.promoRevenueShare}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                      <span>
                        {promotionPerf.data.regularDishCount} plats ·{" "}
                        {formatNumber(
                          promotionPerf.data.regularTotalSold
                        )}{" "}
                        vendus
                      </span>
                      <span>
                        Moy.{" "}
                        {formatCurrencyXOF(
                          promotionPerf.data.regularAvgBasket
                        )}
                        /plat
                      </span>
                    </div>
                  </div>
                  {/* Résumé comparatif */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-gray-400">
                        Total plats
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {promotionPerf.data.promoDishCount +
                          promotionPerf.data.regularDishCount}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-gray-400">
                        Total vendus
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {formatNumber(
                          promotionPerf.data.promoTotalSold +
                            promotionPerf.data.regularTotalSold
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-gray-400">
                        CA total
                      </div>
                      <div className="text-sm font-bold text-green-700">
                        {formatCurrencyXOF(
                          promotionPerf.data.promoRevenue +
                            promotionPerf.data.regularRevenue
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </StatsChartCard>
            )}
          </div>

          {/* ========================================== */}
          {/* SECTION 7 : Par Restaurant (table)         */}
          {/* ========================================== */}
          {byRestaurant.data &&
            byRestaurant.data.byRestaurant?.length > 0 && (
              <StatsChartCard
                title="Répartition par Restaurant"
                subtitle={byRestaurant.data.dishName}
                icon={Store}
              >
                <StatsTable
                  columns={[
                    { key: "rank", label: "#", width: "35px" },
                    { key: "restaurant", label: "Restaurant" },
                    {
                      key: "totalSold",
                      label: "Plats vendus",
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
                  rows={byRestaurant.data.byRestaurant.map((r, i) => ({
                    rank: (
                      <span className="font-bold text-[#F17922]">
                        #{i + 1}
                      </span>
                    ),
                    restaurant: (
                      <span className="font-medium text-gray-800">
                        {r.restaurantName}
                      </span>
                    ),
                    totalSold: (
                      <span className="font-semibold">
                        {formatNumber(r.totalSold)}
                      </span>
                    ),
                    revenue: (
                      <span className="text-green-700 font-medium">
                        {formatCurrencyXOF(r.revenue)}
                      </span>
                    ),
                    percentage: (
                      <span className="bg-orange-50 text-[#F17922] px-2 py-0.5 rounded-full text-xs font-medium">
                        {formatPercentage(r.percentage)}
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
