"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { formatImageUrl } from "@/utils/imageHelpers";
import { XCircle } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import CarteNationHeader from "../../../../features/carte-nation/components/CarteNationHeader";
import { CarteNationTable } from "../../../../features/carte-nation/components/liste-carte-nation";
import StatutCardTab from "../../../../features/carte-nation/components/liste-carte-nation/StatutCardTab";
import { UpdateCardStatusModal } from "../../../../features/carte-nation/components/liste-carte-nation/UpdateCardStatusModal";
import { DemandeCarteList } from "../../../../features/carte-nation/components/liste-demandes-carte";
import { useCardListQuery } from "../../../../features/carte-nation/queries/cards.query";
import {
  NationCard,
  NationCardStatus,
} from "../../../../features/carte-nation/types/carte-nation.types";

export default function CarteNation() {
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
        <CarteNationHeader />
      </div>

      {/* Carte Nation */}
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

      {/* Demande Carte */}
      {activeTab == "card_requests" && viewCardRequest === "list" && (
        <DemandeCarteList />
      )}
      {/* Update Carte Status Modal */}
      {selectedItem &&
        (modals?.activate || modals?.suspend || modals?.revoke) && (
          <UpdateCardStatusModal
            isOpen={true}
            cardId={(selectedItem as NationCard).id}
            customerName={
              (selectedItem as NationCard).customer?.first_name +
              " " +
              (selectedItem as NationCard).customer?.last_name
            }
            action={
              (modals?.activate
                ? "activate"
                : modals?.suspend
                ? "suspend"
                : modals?.revoke
                ? "revoke"
                : "activate") as "activate" | "suspend" | "revoke"
            }
            onClose={() => {
              handleToggleCardModal(
                null,
                (modals?.activate
                  ? "activate"
                  : modals?.suspend
                  ? "suspend"
                  : modals?.revoke
                  ? "revoke"
                  : "activate") as "activate" | "suspend" | "revoke"
              );
            }}
          />
        )}

      {/* Image Viewer Modal */}
      {selectedItem && modals?.viewCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => handleToggleCardModal(null, "viewCard")}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleToggleCardModal(null, "viewCard")}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <Image
              src={formatImageUrl((selectedItem as NationCard)?.card_image_url)}
              alt="Carte de la nation"
              width={1200}
              height={800}
              unoptimized={true}
              className="w-full h-auto rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
