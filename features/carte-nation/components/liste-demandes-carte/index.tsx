"use client";

import { PaginationInfo } from "@/components/TableStates";
import { useDashboardStore } from "@/store/dashboardStore";
import { Eye, Info } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { dateToLocalString } from "../../../../utils/date/format-date";
import { useRequestListQuery } from "../../queries/requests.query";
import { CardRequest, CardRequestStatus } from "../../types/carte-nation.types";
import {
  CardLevelBadge,
  getProfileTypeLabel,
  isStudentProfile,
  resolveCardLevel,
} from "../../utils/getCardLevelBadge";
import { getStatusBadgeRequestCard } from "../../utils/getStatusBadgeRequestCard";
import { DetailCardModal } from "./DetailCardModal";
import StatutCardRequestTab from "./StatutCardRequestTab";

export function DemandeCarteList() {
  const {
    card_requests: { filters, selectedItem, modals, pagination },
    toggleModal,
    setSelectedItem,
  } = useDashboardStore();

  const { data: requests, isLoading } = useRequestListQuery({
    page: pagination.page,
    limit: pagination.limit,
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
      <div className="w-full">
        {/* Bandeau : la carte n'est plus auto-émise — toute demande est validée ici. */}
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Validation requise.</span> Toutes les
            demandes arrivent <strong>en attente</strong> et doivent être{" "}
            <strong>approuvées ici</strong> pour générer la carte. À
            l&apos;approbation, vous choisissez le <strong>type de carte</strong>{" "}
            (Étudiant / Standard / VIP / VVIP). L&apos;approbation émet la carte et
            notifie le client («&nbsp;carte prête&nbsp;») ; le refus le notifie aussi.
          </div>
        </div>

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
                    Étudiant
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Profil
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Niveau
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
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      Aucune demande trouvée
                    </td>
                  </tr>
                ) : (
                  requests?.data.map((request) => {
                    const student = isStudentProfile(request);
                    return (
                      <tr
                        key={request.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {request.customer?.image ? (
                              <Image
                                src={
                                  request.customer.image || "/placeholder.svg"
                                }
                                alt={`${request.customer.first_name} ${request.customer.last_name}`}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#F17922] to-[#ff9f5a] flex items-center justify-center text-white font-bold text-sm">
                                {request.customer?.first_name?.charAt(0) ?? ""}
                                {request.customer?.last_name?.charAt(0) ?? ""}
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
                        {/* Étudiant ou non (déclaré à la demande) */}
                        <td className="py-4 px-6">
                          {student ? (
                            <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                              Oui
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                              Non
                            </span>
                          )}
                        </td>
                        {/* Profil : uniquement les infos utiles (plus de « Déclaratif »/« justificatif ») */}
                        <td className="py-4 px-6">
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-sm text-gray-900">
                              {getProfileTypeLabel(
                                request.profile_type ??
                                  (student ? "STUDENT" : null)
                              )}
                            </span>
                            {request.institution && (
                              <span
                                className="block max-w-[14rem] truncate text-xs text-gray-500"
                                title={request.institution}
                              >
                                {request.institution}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <CardLevelBadge
                            level={resolveCardLevel(request)}
                            size="sm"
                          />
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
                        {/* Une seule action : tout se passe dans la modale Détail
                            (approuver / rejeter / supprimer y sont intégrés). */}
                        <td className="py-4 px-6">
                          <button
                            onClick={() =>
                              handleToggleOrderModal(request, "detail")
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#F17922]/40 hover:bg-[#F17922]/10 hover:text-[#F17922]"
                            title="Voir le détail de la demande"
                          >
                            <Eye className="h-4 w-4" />
                            Voir détail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationInfo
            tabKey="card_requests"
            label="demande"
            totalItems={requests?.meta?.total}
            totalPages={requests?.meta?.totalPages}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Modale UNIQUE : détail + approuver / rejeter / supprimer (panneaux inline) */}
      {selectedItem && modals?.detail && (
        <DetailCardModal
          request={selectedItem as CardRequest}
          onClose={() => handleToggleOrderModal(null, "detail")}
        />
      )}
    </div>
  );
}
