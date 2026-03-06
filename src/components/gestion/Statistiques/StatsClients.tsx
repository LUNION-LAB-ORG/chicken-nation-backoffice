"use client";

import React, { useState } from "react";
import { Smartphone, RefreshCcw, Trophy, Moon, Download } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  useClientsOverviewQuery,
  useClientsRetentionQuery,
  useTopClientsQuery,
  useInactiveClientsQuery,
} from "../../../../features/statistics/queries/statistics-clients.query";
import { StatsFilters, DEFAULT_STATS_FILTERS } from "../../../../features/statistics/filters/statistics.filters";
import {
  formatCurrencyXOF,
  formatNumber,
  formatPercentage,
  getPerformanceColor,
  getChannelLabel,
  truncateName,
} from "../../../../features/statistics/utils/stats-formatters";
import { exportChurnToCSV, exportTopClientsToCSV } from "../../../../features/statistics/utils/export-excel";
import StatsPeriodFilter from "./shared/StatsPeriodFilter";
import StatsCard from "./shared/StatsCard";
import StatsTable from "./shared/StatsTable";
import StatsLoadingState from "./shared/StatsLoadingState";
import StatsErrorState from "./shared/StatsErrorState";

export default function StatsClients() {
  const { selectedRestaurantId } = useDashboardStore();
  const [filters, setFilters] = useState<StatsFilters>({
    ...DEFAULT_STATS_FILTERS,
    restaurantId: selectedRestaurantId ?? undefined,
  });
  const [inactiveDays, setInactiveDays] = useState(30);

  const queryParams = {
    ...filters,
    restaurantId: filters.restaurantId ?? selectedRestaurantId ?? undefined,
  };

  const overview = useClientsOverviewQuery(queryParams);
  const retention = useClientsRetentionQuery(queryParams.restaurantId);
  const topClients = useTopClientsQuery({ ...queryParams, limit: 10 });
  const inactive = useInactiveClientsQuery({ restaurantId: queryParams.restaurantId, inactiveDays, limit: 100 });

  const isLoading = overview.isLoading;
  const isError = overview.isError;

  const retentionRate = retention.data?.retentionRate ?? 0;
  const retentionColor = getPerformanceColor(retentionRate);

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
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            Acquisition, rétention, LTV et profils clients
          </p>
        </div>
        <StatsPeriodFilter filters={filters} onChange={setFilters} />
      </div>

      {isLoading && <StatsLoadingState />}
      {isError && <StatsErrorState onRetry={() => overview.refetch()} />}

      {!isLoading && !isError && (
        <>
          {/* KPI Cards */}
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
              color={retentionRate >= 70 ? "green" : retentionRate >= 40 ? "orange" : "red"}
            />
          </div>

          {/* Canal d'acquisition */}
          {overview.data && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                <Smartphone className="inline w-4 h-4 mr-1.5 text-[#F17922]" />Acquisition par Canal
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#F17922]">
                    {formatNumber(overview.data.appClients)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">via App Mobile</div>
                  <div className="text-xs text-orange-400 mt-0.5">
                    {overview.data.totalClients > 0
                      ? formatPercentage((overview.data.appClients / overview.data.totalClients) * 100)
                      : "0%"}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700">
                    {formatNumber(overview.data.callCenterClients)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">via Call Center</div>
                  <div className="text-xs text-blue-400 mt-0.5">
                    {overview.data.totalClients > 0
                      ? formatPercentage((overview.data.callCenterClients / overview.data.totalClients) * 100)
                      : "0%"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rétention & Churn */}
          {retention.data && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                <RefreshCcw className="inline w-4 h-4 mr-1.5 text-green-500" />Rétention &amp; Churn
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600" style={{ color: retentionColor }}>
                    {retentionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Taux de rétention</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-700">
                    {formatNumber(retention.data.activeClients)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Actifs (30j)</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600">
                    {retention.data.churnRate30.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Churn 30j</div>
                  <div className="text-xs text-gray-500">{formatNumber(retention.data.churn30Days)} clients</div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-500">
                    {retention.data.churnRate60.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Churn 60j</div>
                  <div className="text-xs text-gray-500">{formatNumber(retention.data.churn60Days)} clients</div>
                </div>
              </div>
            </div>
          )}

          {/* Top Clients */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800"><Trophy className="inline w-4 h-4 mr-1.5 text-amber-500" />Top 10 Clients</h2>
              {topClients.data && (
                <button
                  onClick={handleExportTopClients}
                  className="text-xs text-[#F17922] hover:underline font-medium"
                >
                  <Download className="inline w-3 h-3 mr-1" />Exporter CSV
                </button>
              )}
            </div>
            <StatsTable
              columns={[
                { key: "rank", label: "#", width: "40px" },
                { key: "name", label: "Client" },
                { key: "orders", label: "Commandes", align: "right" },
                { key: "ltv", label: "LTV", align: "right" },
                { key: "basket", label: "Panier moy.", align: "right" },
                { key: "channel", label: "Canal" },
              ]}
              rows={(topClients.data?.items ?? []).map((c, i) => ({
                rank: <span className="font-bold text-[#F17922]">#{i + 1}</span>,
                name: (
                  <div>
                    <div className="font-medium text-gray-800">{truncateName(c.fullname)}</div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </div>
                ),
                orders: <span className="font-semibold">{formatNumber(c.totalOrders)}</span>,
                ltv: <span className="text-green-700 font-medium">{c.totalSpentFormatted}</span>,
                basket: <span className="text-gray-600">{formatCurrencyXOF(c.averageBasket)}</span>,
                channel: (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.preferredChannel === "APP"
                      ? "bg-orange-50 text-[#F17922]"
                      : c.preferredChannel === "CALL_CENTER"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-purple-50 text-purple-700"
                  }`}>
                    {getChannelLabel(c.preferredChannel)}
                  </span>
                ),
              }))}
            />
          </div>

          {/* Clients Inactifs / Churn */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  <Moon className="inline w-4 h-4 mr-1.5 text-gray-400" />Clients Inactifs (campagne réactivation)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Exportez pour campagne SMS/WhatsApp Twilio
                </p>
              </div>
              <div className="flex items-center gap-3">
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
                    className="px-3 py-1.5 bg-[#F17922] text-white text-xs font-medium rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    <Download className="inline w-3 h-3 mr-1" />Exporter {formatNumber(inactive.data.totalCount)} clients
                  </button>
                )}
              </div>
            </div>
            <StatsTable
              columns={[
                { key: "name", label: "Client" },
                { key: "phone", label: "Téléphone" },
                { key: "lastOrder", label: "Dernière commande" },
                { key: "inactiveDays", label: "Jours inactifs", align: "right" },
                { key: "totalOrders", label: "Total cmd.", align: "right" },
                { key: "channel", label: "Canal" },
              ]}
              rows={(inactive.data?.items ?? []).slice(0, 10).map((c) => ({
                name: <span className="font-medium text-gray-800">{truncateName(c.fullname)}</span>,
                phone: <span className="text-gray-500 text-xs">{c.phone}</span>,
                lastOrder: <span className="text-gray-500 text-xs">{new Date(c.lastOrderDate).toLocaleDateString("fr-FR")}</span>,
                inactiveDays: (
                  <span className={`font-semibold ${c.daysSinceLastOrder >= 60 ? "text-red-500" : "text-yellow-600"}`}>
                    {c.daysSinceLastOrder}j
                  </span>
                ),
                totalOrders: <span className="text-gray-600">{formatNumber(c.totalOrders)}</span>,
                channel: (
                  <span className="text-xs text-gray-500">{getChannelLabel(c.preferredChannel)}</span>
                ),
              }))}
              emptyMessage="Aucun client inactif sur cette période"
            />
            {(inactive.data?.totalCount ?? 0) > 10 && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Affichage des 10 premiers — exportez le CSV pour voir tous les {formatNumber(inactive.data!.totalCount)} clients
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
