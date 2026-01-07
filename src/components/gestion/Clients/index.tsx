"use client";

import React from "react";
import ClientHeader from "../../../../features/customer/components/ClientHeader";
import { UserCounter } from "../../../../features/customer/components/UserCounter";
import { GlobalReviews } from "../../../../features/customer/components/GlobalReviews";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useCustomerListQuery } from "../../../../features/customer/queries/customer-list.query";
import { UserType } from "../../../../features/users/types/user.types";
import { ClientsTable } from "../../../../features/customer/components/list-customer";
import { ClientDetail } from "../../../../features/customer/components/detail-customer";
import { DemandeCarteList } from "../../../../features/customer/components/liste-demandes-carte";

export default function Clients() {
  const { user } = useAuthStore();

  const {
    activeTab,
    "card-requests": { view: viewCardRequest },
    clients: { view, selectedItem, filters, pagination },
  } = useDashboardStore();

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
  });

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <ClientHeader />
        {/* Clients */}
        {activeTab == "clients" && view === "list" && (
          <UserCounter count={clientResponse?.meta?.total ?? 0} />
        )}
      </div>

      {/* Clients */}
      {activeTab == "clients" && view === "list" && (
        <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden min-h-[600px]">
          <ClientsTable
            clientResponse={clientResponse}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}

      {activeTab == "clients" && view === "view" && selectedItem && (
        <ClientDetail clientId={selectedItem} />
      )}
      {/* Review */}
      {activeTab == "reviews" && view === "list" && <GlobalReviews />}

      {/* Carte Nation */}
      {activeTab == "card-requests" && viewCardRequest === "list" && (
        <DemandeCarteList />
      )}
    </div>
  );
}
