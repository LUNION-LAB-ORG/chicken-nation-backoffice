"use client";

import React, { useState } from "react";
import { Trophy, FolderOpen, Store } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  useTopProductsQuery,
  useTopCategoriesQuery,
  useProductsByRestaurantQuery,
} from "../../../../features/statistics/queries/statistics-products.query";
import { StatsFilters, DEFAULT_STATS_FILTERS } from "../../../../features/statistics/filters/statistics.filters";
import { formatCurrencyXOF, formatNumber, formatPercentage, truncateName } from "../../../../features/statistics/utils/stats-formatters";
import StatsPeriodFilter from "./shared/StatsPeriodFilter";
import StatsCard from "./shared/StatsCard";
import StatsTable from "./shared/StatsTable";
import StatsLoadingState from "./shared/StatsLoadingState";
import StatsErrorState from "./shared/StatsErrorState";
import { formatImageUrl } from "@/utils/imageHelpers";

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

  const topProducts = useTopProductsQuery({ ...queryParams, limit: 10 });
  const topCategories = useTopCategoriesQuery({ ...queryParams, limit: 5 });
  const byRestaurant = useProductsByRestaurantQuery(queryParams);

  const isLoading = topProducts.isLoading || topCategories.isLoading;
  const isError = topProducts.isError || topCategories.isError;

  // Calculer le CA total à partir des items
  const totalRevenue = topProducts.data?.items?.reduce((acc, i) => acc + i.revenue, 0) ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits &amp; Catégories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyse des performances des plats et catégories sur la période
          </p>
        </div>
        <StatsPeriodFilter filters={filters} onChange={setFilters} />
      </div>

      {isLoading && <StatsLoadingState />}
      {isError && <StatsErrorState onRetry={() => { topProducts.refetch(); topCategories.refetch(); }} />}

      {!isLoading && !isError && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Plats analysés"
              value={formatNumber(topProducts.data?.items?.length ?? 0)}
              subtitle="dans le top"
              color="orange"
            />
            <StatsCard
              title="Revenus top produits"
              value={formatCurrencyXOF(totalRevenue)}
              subtitle="sur la période"
              color="green"
            />
            <StatsCard
              title="Plats distincts vendus"
              value={formatNumber(topProducts.data?.uniqueDishesCount ?? 0)}
              subtitle="plats différents"
              color="blue"
            />
          </div>

          {/* Top Produits */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              <Trophy className="inline w-4 h-4 mr-1.5 text-amber-500" />Top 10 Plats les plus commandés
            </h2>
            <StatsTable
              columns={[
                { key: "rank", label: "#", width: "40px" },
                { key: "dishName", label: "Plat" },
                { key: "categoryName", label: "Catégorie" },
                { key: "orderCount", label: "Vendus", align: "right" },
                { key: "revenue", label: "CA Généré", align: "right" },
                { key: "percentage", label: "Part", align: "right" },
              ]}
              rows={(topProducts.data?.items ?? []).map((item, i) => ({
                rank: <span className="font-bold text-[#F17922]">#{i + 1}</span>,
                dishName: (
                  <div className="flex items-center gap-2">
                    {item.image && (
                      <img src={formatImageUrl(item.image)} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                    )}
                    <span className="font-medium text-gray-800">{truncateName(item.name)}</span>
                  </div>
                ),
                categoryName: <span className="text-gray-500 text-sm">{item.categoryName}</span>,
                orderCount: <span className="font-semibold">{formatNumber(item.totalSold)}</span>,
                revenue: <span className="text-green-700 font-medium">{formatCurrencyXOF(item.revenue)}</span>,
                percentage: (
                  <span className="bg-orange-50 text-[#F17922] px-2 py-0.5 rounded-full text-xs font-medium">
                    {formatPercentage(item.percentage)}
                  </span>
                ),
              }))}
            />
          </div>

          {/* Top Catégories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              <FolderOpen className="inline w-4 h-4 mr-1.5 text-blue-500" />Top Catégories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(topCategories.data?.items ?? []).map((cat, i) => (
                <div key={cat.id} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#F17922]">#{i + 1}</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1 truncate">{cat.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatNumber(cat.totalSold)} cmd.</div>
                  <div className="text-xs text-green-700 font-medium mt-0.5">{formatCurrencyXOF(cat.revenue)}</div>
                  <div className="text-xs text-orange-500 mt-1">{formatPercentage(cat.percentage)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Par Restaurant */}
          {byRestaurant.data && byRestaurant.data.byRestaurant?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                <Store className="inline w-4 h-4 mr-1.5 text-purple-500" />Répartition par Restaurant
              </h2>
              <StatsTable
                columns={[
                  { key: "restaurant", label: "Restaurant" },
                  { key: "totalSold", label: "Plats vendus", align: "right" },
                  { key: "revenue", label: "CA", align: "right" },
                  { key: "percentage", label: "Part", align: "right" },
                ]}
                rows={(byRestaurant.data.byRestaurant).map((r) => ({
                  restaurant: <span className="font-medium text-gray-800">{r.restaurantName}</span>,
                  totalSold: <span className="font-semibold">{formatNumber(r.totalSold)}</span>,
                  revenue: <span className="text-green-700 font-medium">{formatCurrencyXOF(r.revenue)}</span>,
                  percentage: (
                    <span className="bg-orange-50 text-[#F17922] px-2 py-0.5 rounded-full text-xs font-medium">
                      {formatPercentage(r.percentage)}
                    </span>
                  ),
                }))}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
