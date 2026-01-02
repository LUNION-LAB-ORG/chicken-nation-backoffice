"use client";

import { useState } from "react";
import { useCustomerDetailQuery } from "../../queries/customer-detail.query";
import { mapCustomerData } from "../../utils/customer-mapper";
import { ErrorState, LoadingState } from "@/components/TableStates";
import { ClientHeader } from "./ClientHeader";
import { ClientTabs } from "./ClientTabs";
import { OverviewTab } from "./OverviewTab";
import { OrdersTab } from "./OrdersTab";
import { FavoritesTab } from "./FavoritesTab";
import { ReviewsTab } from "./ReviewsTab";
import { AddressesTab } from "./AddressesTab";
import { CarteTab } from "./CarteTab";

interface ClientDetailPageProps {
  clientId: string;
}

export function ClientDetail({ clientId }: ClientDetailPageProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "favorites" | "reviews" | "addresses" | "card"
  >("overview");

  const { data, isLoading, error } = useCustomerDetailQuery(clientId);

  const customerData = isLoading ? null : mapCustomerData(data);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState error={error} title="Erreur lors du chargement du client" />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Card with Customer Info */}
      <ClientHeader customerData={customerData} />

      {/* Tabs */}
      <ClientTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <OverviewTab customerData={customerData} />
        )}
        {activeTab === "orders" && <OrdersTab customerData={customerData} />}
        {activeTab === "favorites" && (
          <FavoritesTab customerData={customerData} />
        )}
        {activeTab === "reviews" && <ReviewsTab customerData={customerData} />}
        {activeTab === "addresses" && (
          <AddressesTab customerData={customerData} />
        )}
        {activeTab === "card" && <CarteTab customerData={customerData} />}
      </div>
    </div>
  );
}
