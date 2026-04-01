"use client";

import React, { useState } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { Ticket, Tag, MapPin, MessageSquare, Download } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  usePromoUsageQuery,
  usePromotionsPerformanceQuery,
  useTopZonesQuery,
  useChurnExportQuery,
} from "../../../../features/statistics/queries/statistics-marketing.query";
import { StatsFilters, DEFAULT_STATS_FILTERS } from "../../../../features/statistics/filters/statistics.filters";
import {
  formatCurrencyXOF,
  formatNumber,
  formatPercentage,
  truncateName,
} from "../../../../features/statistics/utils/stats-formatters";
import { exportChurnToCSV, exportZonesToCSV } from "../../../../features/statistics/utils/export-excel";
import StatsPeriodFilter from "./shared/StatsPeriodFilter";
import StatsCard from "./shared/StatsCard";
import StatsTable from "./shared/StatsTable";
import StatsLoadingState from "./shared/StatsLoadingState";
import StatsErrorState from "./shared/StatsErrorState";

export default function StatsMarketing() {
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

  const promoUsage = usePromoUsageQuery(queryParams);
  const promotionsPerf = usePromotionsPerformanceQuery(queryParams);
  const topZones = useTopZonesQuery({ ...queryParams, limit: 10 });
  const churnExport = useChurnExportQuery({ restaurantId: queryParams.restaurantId, inactiveDays });

  const isLoading = promoUsage.isLoading || promotionsPerf.isLoading;
  const isError = promoUsage.isError && promotionsPerf.isError;

  const handleExportZones = () => {
    if (!topZones.data) return;
    exportZonesToCSV(topZones.data.items);
  };

  const handleExportChurn = () => {
    if (!churnExport.data) return;
    exportChurnToCSV(
      churnExport.data.items.map((c) => ({
        phone: c.phone,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        lastOrderDate: c.lastOrderDate,
        daysSinceLastOrder: c.daysSinceLastOrder,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent,
        preferredChannel: c.preferredChannel,
      })),
      inactiveDays
    );
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Marketing & Promotions"
          subtitle="ROI promotions, zones street marketing, export campagnes"
          actions={[{ label: "", onClick: () => {}, customComponent: <StatsPeriodFilter filters={filters} onChange={setFilters} /> }]}
        />
      </div>

      {isLoading && <StatsLoadingState />}
      {isError && (
        <StatsErrorState onRetry={() => { promoUsage.refetch(); promotionsPerf.refetch(); }} />
      )}

      {!isLoading && !isError && (
        <>
          {/* KPI Cards Promos */}
          {promoUsage.data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                title="Promos utilisées"
                value={formatNumber(promoUsage.data.totalPromos)}
                subtitle="codes différents"
                color="orange"
              />
              <StatsCard
                title="Remises accordées"
                value={formatCurrencyXOF(promoUsage.data.totalDiscountAccorded)}
                subtitle="valeur totale des remises"
                color="red"
              />
              <StatsCard
                title="CA avec Promos"
                value={formatCurrencyXOF(promoUsage.data.totalRevenueWithPromo)}
                subtitle="revenu généré par les promos"
                color="green"
              />
            </div>
          )}

          {/* Performance des Promotions */}
          {promotionsPerf.data && promotionsPerf.data.items.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                <Ticket className="inline w-4 h-4 mr-1.5 text-purple-500" />Performance des Promotions
              </h2>
              <StatsTable
                columns={[
                  { key: "title", label: "Promotion" },
                  { key: "status", label: "Statut" },
                  { key: "usage", label: "Utilisations" },
                  { key: "usageRate", label: "Taux d'usage", align: "right" },
                  { key: "revenue", label: "CA généré", align: "right" },
                ]}
                rows={promotionsPerf.data.items.map((p) => ({
                  title: <span className="font-medium text-gray-800">{truncateName(p.title, 30)}</span>,
                  status: (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.status === "ACTIVE" ? "Active" : "Terminée"}
                    </span>
                  ),
                  usage: (
                    <span>
                      {formatNumber(p.usageCount)}
                      {p.maxUsage > 0 && <span className="text-gray-400">/{formatNumber(p.maxUsage)}</span>}
                    </span>
                  ),
                  usageRate: (
                    <span className={p.usageRate >= 80 ? "text-green-700 font-semibold" : "text-gray-600"}>
                      {formatPercentage(p.usageRate)}
                    </span>
                  ),
                  revenue: <span className="text-green-700 font-medium">{p.revenueGeneratedFormatted}</span>,
                }))}
              />
            </div>
          )}

          {/* Utilisation par Code Promo */}
          {promoUsage.data && promoUsage.data.items.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                <Tag className="inline w-4 h-4 mr-1.5 text-[#F17922]" />Performance par Code Promo (ROI Campagne)
              </h2>
              <StatsTable
                columns={[
                  { key: "title", label: "Promotion" },
                  { key: "usages", label: "Utilisations" },
                  { key: "users", label: "Clients uniques" },
                  { key: "discount", label: "Remise totale", align: "right" },
                  { key: "revenue", label: "CA généré", align: "right" },
                ]}
                rows={promoUsage.data.items.map((p) => ({
                  title: <span className="font-medium text-gray-800">{truncateName(p.title, 28)}</span>,
                  usages: <span className="font-semibold">{formatNumber(p.usageCount)}</span>,
                  users: <span className="text-gray-600">{formatNumber(p.uniqueUsers)}</span>,
                  discount: <span className="text-red-500">{p.totalDiscountFormatted}</span>,
                  revenue: <span className="text-green-700 font-medium">{p.revenueGeneratedFormatted}</span>,
                }))}
              />
            </div>
          )}

          {/* Top Zones (Street Marketing) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800"><MapPin className="inline w-4 h-4 mr-1.5 text-red-500" />Top Zones — Street Marketing</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ciblez ces zones pour vos flyers et animations</p>
              </div>
              {topZones.data && (
                <button
                  onClick={handleExportZones}
                  className="text-xs text-[#F17922] hover:underline font-medium"
                >
                  <Download className="inline w-3 h-3 mr-1" />Exporter CSV (avec GPS)
                </button>
              )}
            </div>
            {topZones.isLoading ? (
              <div className="h-20 bg-gray-50 animate-pulse rounded-xl" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(topZones.data?.items ?? []).map((zone, i) => (
                  <div key={zone.zone} className="bg-gray-50 rounded-xl p-3 text-center hover:bg-orange-50 transition-colors">
                    <div className="text-xl font-bold text-[#F17922]">#{i + 1}</div>
                    <div className="text-sm font-semibold text-gray-800 mt-1 truncate" title={zone.zone}>{zone.zone}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatNumber(zone.orderCount)} cmd.</div>
                    <div className="text-xs text-green-700 font-medium">{zone.revenueFormatted}</div>
                    <div className="text-xs text-orange-400 mt-0.5">{formatPercentage(zone.percentage)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Campagne Churn */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800"><MessageSquare className="inline w-4 h-4 mr-1.5 text-green-500" />Export Campagne Réactivation (SMS / WhatsApp)</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Liste des clients inactifs à relancer via Twilio
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={inactiveDays}
                  onChange={(e) => setInactiveDays(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                >
                  <option value={15}>Inactifs 15j</option>
                  <option value={30}>Inactifs 30j</option>
                  <option value={60}>Inactifs 60j</option>
                  <option value={90}>Inactifs 90j</option>
                </select>
                {churnExport.data && (
                  <button
                    onClick={handleExportChurn}
                    className="px-3 py-1.5 bg-[#F17922] text-white text-xs font-medium rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    <Download className="inline w-3 h-3 mr-1" />Exporter {formatNumber(churnExport.data.totalCount)} contacts
                  </button>
                )}
              </div>
            </div>

            {churnExport.isLoading ? (
              <div className="h-16 bg-gray-50 animate-pulse rounded-xl" />
            ) : churnExport.data ? (
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-800">{formatNumber(churnExport.data.totalCount)}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    clients inactifs depuis {churnExport.data.inactiveDays} jours
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Le fichier CSV contient : prénom, nom, téléphone, email, date dernière commande, canal préféré
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
