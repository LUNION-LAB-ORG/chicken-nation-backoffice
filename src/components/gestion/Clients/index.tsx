"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import ClientHeader from "../../../../features/customer/components/ClientHeader";
import { RestaurantFilterSelect } from "../../../../features/restaurants/components/RestaurantFilterSelect";
import { exportCustomers } from "../../../../features/customer/services/customer.service";
import { UserCounter } from "../../../../features/customer/components/UserCounter";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useCustomerListQuery } from "../../../../features/customer/queries/customer-list.query";
import { UserType } from "../../../../features/users/types/user.types";
import { ClientsTable } from "../../../../features/customer/components/list-customer";
import { ClientDetail } from "../../../../features/customer/components/detail-customer";
import { CustomerSegment } from "../../../../features/customer/types/customer.types";
import {
  Smartphone,
  SmartphoneNfc,
  ShoppingBag,
  ShoppingCart,
  UserX,
  Users,
  Download,
  Loader2,
} from "lucide-react";

const SEGMENT_TABS: {
  key: CustomerSegment | "all";
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "all", label: "Tous", icon: <Users size={16} /> },
  { key: "app_users", label: "Utilisateurs app", icon: <Smartphone size={16} /> },
  { key: "no_app", label: "Sans app", icon: <SmartphoneNfc size={16} /> },
  { key: "has_ordered", label: "Ont commandé", icon: <ShoppingBag size={16} /> },
  { key: "never_ordered", label: "Jamais commandé", icon: <ShoppingCart size={16} /> },
  { key: "incomplete_profile", label: "Profil incomplet", icon: <UserX size={16} /> },
];

export default function Clients() {
  const { user } = useAuthStore();

  const {
    clients: { view, selectedItem, filters, pagination },
    setFilter,
    setPagination,
  } = useDashboardStore();

  const activeSegment = (filters?.segment as CustomerSegment) || "all";
  const isBackoffice = user?.type === UserType.BACKOFFICE;
  // BACKOFFICE : filtre restaurant piloté par le sélecteur (stocké dans le store).
  // RESTAURANT : forcé à son restaurant (le backend l'impose de toute façon).
  const selectedRestaurantId = (filters?.restaurantId as string) || undefined;
  const effectiveRestaurantId = isBackoffice
    ? selectedRestaurantId
    : user?.restaurant_id;

  // Filtres partagés liste + export (le backend ignore page/limit à l'export).
  const baseFilters = {
    restaurantId: effectiveRestaurantId,
    search: filters?.search as string,
    segment: activeSegment !== "all" ? activeSegment : undefined,
  };

  const {
    data: clientResponse,
    isLoading,
    error,
  } = useCustomerListQuery({
    ...baseFilters,
    page: pagination.page,
  });

  const [exporting, setExporting] = useState(false);

  const handleSegmentChange = (segment: CustomerSegment | "all") => {
    setFilter("clients", "segment", segment);
    setPagination("clients", 1, 10);
  };

  const handleRestaurantChange = (restaurantId: string) => {
    setFilter("clients", "restaurantId", restaurantId || undefined);
    setPagination("clients", 1, 10);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCustomers(baseFilters);
      toast.success("Export des clients généré");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <ClientHeader />
        {view === "list" && (
          <UserCounter count={clientResponse?.meta?.total ?? 0} />
        )}
      </div>

      {view === "list" && (
        <>
          {/* Barre d'outils : onglets (gauche) + filtre resto & export (droite) */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Segment filter tabs */}
            <div className="flex flex-wrap gap-2">
              {SEGMENT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleSegmentChange(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    activeSegment === tab.key
                      ? "bg-[#F17922] text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-orange-50 hover:text-[#F17922]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtre restaurant (BACKOFFICE uniquement) + Export Excel */}
            <div className="flex items-center gap-2 shrink-0">
              {isBackoffice && (
                <RestaurantFilterSelect
                  value={selectedRestaurantId ?? ""}
                  onChange={handleRestaurantChange}
                />
              )}
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                title="Exporter les clients filtrés (Excel)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#F17922] text-white hover:bg-[#d96a18] disabled:opacity-60 cursor-pointer shrink-0"
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Exporter
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden min-h-[600px]">
            <ClientsTable
              clientResponse={clientResponse}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </>
      )}

      {view === "view" && selectedItem && (
        <ClientDetail clientId={selectedItem} />
      )}
    </div>
  );
}
