"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { formatImageUrl } from "@/utils/imageHelpers";
import Image from "next/image";
import { useCallback } from "react";
import { dateToLocalString } from "../../../utils/date/format-date";
import { useLoyaltyPointsListQuery } from "../queries/loyalty.queries";
import { LoyaltyPoint, LoyaltyPointType } from "../types/loyalty.types";
import {
  formatPoints,
  getIsUsedBadge,
  getPointTypeBadge,
} from "../utils/loyalty.utils";
import LoyaltyFilterTab from "./LoyaltyFilterTab";

export function LoyaltyPointsList() {
  const {
    loyalty: { filters, selectedItem, modals },
    toggleModal,
    setSelectedItem,
  } = useDashboardStore();

  const { data: points } = useLoyaltyPointsListQuery({
    type: filters?.type as LoyaltyPointType,
    is_used: filters?.is_used as "all" | "available" | "used" | "partial",
    search: filters?.search as string,
  });

  const handleToggleModal = useCallback(
    (point: LoyaltyPoint, modalName: string) => {
      toggleModal("loyalty", modalName);
      setSelectedItem("loyalty", point);
    },
    [toggleModal, setSelectedItem]
  );

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Filtrage */}
        <LoyaltyFilterTab />

        {/* Points List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Client
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Points
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Type
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Statut
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Raison
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Expiration
                  </th>
                </tr>
              </thead>
              <tbody>
                {points?.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      Aucun point trouvé
                    </td>
                  </tr>
                ) : (
                  points?.data.map((point) => (
                    <tr
                      key={point.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleToggleModal(point, "view")}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {point.customer?.image ? (
                            <Image
                              src={formatImageUrl(point.customer.image)}
                              alt={`${point.customer.first_name} ${point.customer.last_name}`}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F17922] to-[#ff9f5a] flex items-center justify-center text-white font-bold text-sm">
                              {point.customer?.first_name?.charAt(0) || ""}
                              {point.customer?.last_name?.charAt(0) || ""}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {point.customer?.first_name}{" "}
                              {point.customer?.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {point.customer?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-lg text-[#F17922]">
                          {formatPoints(point.points)}
                        </div>
                        {point.points_used > 0 && (
                          <div className="text-xs text-gray-500">
                            Utilisés: {formatPoints(point.points_used)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {getPointTypeBadge(point.type)}
                      </td>
                      <td className="py-4 px-6">
                        {getIsUsedBadge(point.points, point.points_used)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {point.reason || "---"}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {dateToLocalString(new Date(point.created_at))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {point.expires_at ? (
                          <div className="text-sm text-gray-600">
                            {dateToLocalString(new Date(point.expires_at))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Jamais</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
