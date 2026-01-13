"use client";

import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useCallback } from "react";
import { CarteNationTable } from "../../../../features/carte-nation/components/liste-carte-nation";
import StatutCardTab from "../../../../features/carte-nation/components/liste-carte-nation/StatutCardTab";
import { useCardListQuery } from "../../../../features/carte-nation/queries/cards.query";
import {
  NationCard,
  NationCardStatus,
} from "../../../../features/carte-nation/types/carte-nation.types";
import PointFideliteHeader from "../../../../features/points_fedelite/components/PointFideliteHeader";

export default function PointFedelisation() {
  const { user } = useAuthStore();

  const {
    activeTab,
    card_nation: { selectedItem, view, filters, pagination, modals },
    card_requests: { view: viewCardRequest },
    toggleModal,
    setSelectedItem,
  } = useDashboardStore();

  const handleToggleCardModal = useCallback(
    (carte: NationCard, modalName: string) => {
      toggleModal("card_nation", modalName);
      setSelectedItem("card_nation", carte);
    },
    [toggleModal, setSelectedItem]
  );
  const {
    data: cartesNation,
    isLoading,
    error,
  } = useCardListQuery({
    page: pagination.page,
    search: filters?.search as string,
    status: filters?.status as NationCardStatus,
    institution: filters?.institution as string,
  });
  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <PointFideliteHeader />
      </div>

      {/* Clients */}
      {activeTab == "card_nation" && view === "list" && (
        <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden min-h-[600px]">
          <StatutCardTab />
          <CarteNationTable
            cartesNationResponse={cartesNation}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}
    </div>
  );
}
