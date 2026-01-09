"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { formatImageUrl } from "@/utils/imageHelpers";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { dateToLocalString } from "../../../../../utils/date/format-date";
import { useRequestListQuery } from "../../queries/requests.query";
import { CardRequest, CardRequestStatus } from "../../types/carte-nation.types";
import { getStatusBadgeRequestCard } from "../../utils/getStatusBadgeRequestCard";
import { ApproveCardModal } from "./ApproveCardModal";
import { RejectCardModal } from "./RejectCardModal";
import StatutCardRequestTab from "./StatutCardRequestTab";

export function DemandeCarteList() {
  const {
    card_requests: { filters, selectedItem, modals },
    toggleModal,
    setSelectedItem,
  } = useDashboardStore();
  const { data: requests } = useRequestListQuery({
    status: filters?.status as CardRequestStatus,
    search: filters?.search as string,
  });

  const handleToggleOrderModal = useCallback(
    (card_request: CardRequest, modalName: string) => {
      toggleModal("card_requests", modalName);
      setSelectedItem("card_requests", card_request);
    },
    [toggleModal, setSelectedItem]
  );
  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Filtrage */}
        <StatutCardRequestTab />
        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Client
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Institution
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Surnom
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Statut
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests?.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Aucune demande trouvée
                    </td>
                  </tr>
                ) : (
                  requests?.data.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {request.customer?.image ? (
                            <Image
                              src={request.customer.image || "/placeholder.svg"}
                              alt={`${request.customer.first_name} ${request.customer.last_name}`}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#F17922] to-[#ff9f5a] flex items-center justify-center text-white font-bold text-sm">
                              {request.customer?.first_name.charAt(0)}
                              {request.customer?.last_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {request.customer?.first_name}{" "}
                              {request.customer?.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {request.customer?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {request.institution}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {request.nickname ? (
                          <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                            {request.nickname}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Non défini
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {dateToLocalString(new Date(request.created_at))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadgeRequestCard(request.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleOrderModal(request, "view")
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir la carte"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {request.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleToggleOrderModal(request, "approve")
                                }
                                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approuver"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleOrderModal(request, "reject")
                                }
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Rejeter"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}

      {selectedItem && modals?.approve && (
        <ApproveCardModal
          isOpen={true}
          request={selectedItem as CardRequest}
          onClose={() => {
            handleToggleOrderModal(null, "approve");
          }}
        />
      )}
      {selectedItem && modals?.reject && (
        <RejectCardModal
          isOpen={true}
          request={selectedItem as CardRequest}
          onClose={() => {
            handleToggleOrderModal(null, "reject");
          }}
        />
      )}
      {/* Image Viewer Modal */}
      {selectedItem && modals?.view && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => handleToggleOrderModal(null, "view")}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleToggleOrderModal(null, "view")}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <Image
              src={formatImageUrl(
                (selectedItem as CardRequest)?.student_card_file_url
              )}
              alt="Carte étudiante"
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
