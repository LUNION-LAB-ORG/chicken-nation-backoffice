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

export default function Clients() {
  const { user } = useAuthStore();

  const {
    clients: { view, selectedItem, filters, pagination, modals },
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
    search: filters?.search,
  });

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <ClientHeader />
        {view === "list" && (
          <UserCounter count={clientResponse?.data?.length} />
        )}
      </div>

      {view === "list" && (
        <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden min-h-[600px]">
          <ClientsTable
            clientResponse={clientResponse}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}

      {view === "view" && selectedItem && (
        <ClientDetail clientId={selectedItem} />
      )}
      {view === "reviews" && <GlobalReviews />}
    </div>
  );
}
