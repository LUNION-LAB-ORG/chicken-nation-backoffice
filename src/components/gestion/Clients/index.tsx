"use client";

import React from "react";
import ClientHeader from "../../../../features/customer/components/ClientHeader";
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

  const {
    data: clientResponse,
    isLoading,
    error,
  } = useCustomerListQuery({
    restaurantId:
      user && user.type == UserType.BACKOFFICE
        ? undefined
        : user?.restaurant_id,
    page: pagination.page,
    search: filters?.search as string,
    segment: activeSegment !== "all" ? activeSegment : undefined,
  });

  const handleSegmentChange = (segment: CustomerSegment | "all") => {
    setFilter("clients", "segment", segment);
    setPagination("clients", 1, 10);
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
