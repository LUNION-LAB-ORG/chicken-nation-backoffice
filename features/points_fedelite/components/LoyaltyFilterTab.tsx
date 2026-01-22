"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import React from "react";
import { LoyaltyPointType } from "../types/loyalty.types";

const LoyaltyFilterTab: React.FC = () => {
  const {
    loyalty: { filters },
    setFilter,
    setPagination,
  } = useDashboardStore();

  const handleTypeChange = (key: LoyaltyPointType | null) => {
    setFilter("loyalty", "type", key);
    setPagination("loyalty", 1, 10);
  };

  const handleIsUsedChange = (
    key: "all" | "available" | "used" | "partial",
  ) => {
    setFilter("loyalty", "is_used", key);
    setPagination("loyalty", 1, 10);
  };

  const pointTypes: { key: LoyaltyPointType; label: string }[] = [
    { key: "EARNED", label: "Gagnés" },
    { key: "REDEEMED", label: "Utilisés" },
    { key: "EXPIRED", label: "Expirés" },
    { key: "BONUS", label: "Bonus" },
  ];

  const usageStatus: {
    key: "all" | "available" | "used" | "partial";
    label: string;
  }[] = [
    { key: "all", label: "Tous" },
    { key: "available", label: "Disponibles" },
    { key: "used", label: "Utilisés" },
    { key: "partial", label: "Partiels" },
  ];

  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
      {/* Filtres Type */}
      <div className="w-full">
        <div className="text-xs font-semibold text-gray-600 mb-2">
          TYPE DE POINTS
        </div>
        <div className="w-full overflow-x-auto">
          <div
            className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit min-w-full scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent"
            style={{ minHeight: 40 }}
          >
            <button
              className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px] px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap shrink-0
                ${
                  !filters?.type || filters?.type === null
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
              `}
              style={{ minWidth: 75, height: 30 }}
              onClick={() => handleTypeChange(null)}
            >
              Tous
            </button>
            {pointTypes.map((type) => (
              <button
                key={type.key}
                className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px] px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap shrink-0 ml-1
                ${
                  filters?.type === type.key
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
              `}
                style={{ minWidth: 75, height: 30 }}
                onClick={() => handleTypeChange(type.key)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Filtres Statut d'utilisation */}
      <div className="w-full">
        <div className="text-xs font-semibold text-gray-600 mb-2">
          STATUT D'UTILISATION
        </div>
        <div className="w-full overflow-x-auto">
          <div
            className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit min-w-full scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent"
            style={{ minHeight: 40 }}
          >
            <button
              className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px] px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap shrink-0
                ${
                  !filters?.is_used || filters?.is_used === null
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
              `}
              style={{ minWidth: 75, height: 30 }}
              onClick={() => handleIsUsedChange(null)}
            >
              Tous
            </button>
            {usageStatus.map((status) => (
              <button
                key={status.key}
                className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px] px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap shrink-0 ml-1
                ${
                  filters?.is_used === status.key
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
              `}
                style={{ minWidth: 75, height: 30 }}
                onClick={() => handleIsUsedChange(status.key)}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyFilterTab;
