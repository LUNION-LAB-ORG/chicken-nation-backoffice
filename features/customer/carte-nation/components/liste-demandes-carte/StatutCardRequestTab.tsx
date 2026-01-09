"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import React from "react";
import { CardRequestStatus } from "../../types/carte-nation.types";

const StatutCardRequestTab: React.FC = () => {
  const {
    card_requests: { filters },
    setFilter,
    setPagination,
  } = useDashboardStore();

  const handleStatusChange = (key: CardRequestStatus) => {
    setFilter("card_requests", "status", key);
    setPagination("card_requests", 1, 10);
  };

  const listStatus: { key: CardRequestStatus; label: string }[] = [
    {
      key: "PENDING",
      label: "En attente",
    },
    {
      key: "IN_REVIEW",
      label: "En révision",
    },
    {
      key: "APPROVED",
      label: "Approuvée",
    },
    {
      key: "REJECTED",
      label: "Rejetée",
    },
    {
      key: "EXPIRED",
      label: "Expirée",
    },
  ];

  return (
    <div className="mb-6 w-full">
      <div className="w-full overflow-x-auto">
        <div
          className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit min-w-full
          scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent"
          style={{ minHeight: 40 }}
        >
          <button
            className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
                 px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap flex-shrink-0
                ${
                  !filters?.status || filters?.status === null
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
              `}
            style={{ minWidth: 75, height: 30 }}
            onClick={() => handleStatusChange(null)}
          >
            Tous les status
          </button>
          {listStatus.map((status) => (
            <button
              key={status.key}
              className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
                 px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap flex-shrink-0
                ${
                  filters?.status === status.key
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
                ml-1
              `}
              style={{ minWidth: 75, height: 30 }}
              onClick={() => handleStatusChange(status.key)}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatutCardRequestTab;
