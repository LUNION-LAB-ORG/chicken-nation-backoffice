import { useDashboardStore } from "@/store/dashboardStore";
import { formatImageUrl } from "@/utils/imageHelpers";
import Image from "next/image";
import { useCallback } from "react";
import { LoyaltyPoint } from "../../types/loyalty.types";
import { dateToLocalString } from "../../../../utils/date/format-date";
import {
  formatPoints,
  getIsUsedBadge,
  getPointTypeBadge,
} from "../../utils/loyalty.utils";

interface LoyaltyPointRowProps {
  point: LoyaltyPoint;
  isMobile?: boolean;
}

export function LoyaltyPointRow({
  point,
  isMobile = false,
}: LoyaltyPointRowProps) {
  const { toggleModal, setSelectedItem } = useDashboardStore();

  const handleToggleModal = useCallback(() => {
    toggleModal("loyalty", "view");
    setSelectedItem("loyalty", point);
  }, [toggleModal, setSelectedItem, point]);

  const formattedDate = point.created_at
    ? dateToLocalString(new Date(point.created_at))
    : "---";

  const formattedExpiration = point.expires_at
    ? dateToLocalString(new Date(point.expires_at))
    : null;

  const fullName = `${point.customer?.first_name || ""} ${
    point.customer?.last_name || ""
  }`.trim();
  const displayName = fullName || point.customer?.phone || "Client inconnu";

  if (isMobile) {
    return (
      <div
        className="bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggleModal}
      >
        <div className="flex items-start gap-3 mb-3">
          {point.customer?.image ? (
            <Image
              src={formatImageUrl(point.customer.image)}
              alt={displayName}
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
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-900">
              {displayName}
            </div>
            <div className="text-xs text-gray-500">{point.customer?.phone}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Points:</span>
            <div>
              <div className="font-bold text-lg text-[#F17922]">
                {formatPoints(point.points)}
              </div>
              {point.points_used > 0 && (
                <div className="text-xs text-gray-500 text-right">
                  Utilisés: {formatPoints(point.points_used)}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Type:</span>
            {getPointTypeBadge(point.type)}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Statut:</span>
            {getIsUsedBadge(point.points, point.points_used)}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Raison:</span>
            <span className="text-sm text-gray-900 max-w-[60%] truncate text-right">
              {point.reason || "---"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Date:</span>
            <span className="text-sm text-gray-600">{formattedDate}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Expiration:</span>
            {formattedExpiration ? (
              <span className="text-sm text-gray-600">
                {formattedExpiration}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Jamais</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={handleToggleModal}
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          {point.customer?.image ? (
            <Image
              src={formatImageUrl(point.customer.image)}
              alt={displayName}
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
              {displayName}
            </div>
            <div className="text-xs text-gray-500">{point.customer?.phone}</div>
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
      <td className="py-4 px-6">{getPointTypeBadge(point.type)}</td>
      <td className="py-4 px-6">
        {getIsUsedBadge(point.points, point.points_used)}
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {point.reason || "---"}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-600">{formattedDate}</div>
      </td>
      <td className="py-4 px-6">
        {formattedExpiration ? (
          <div className="text-sm text-gray-600">{formattedExpiration}</div>
        ) : (
          <span className="text-xs text-gray-400">Jamais</span>
        )}
      </td>
    </tr>
  );
}
