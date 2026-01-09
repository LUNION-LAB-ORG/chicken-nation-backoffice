"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import React from "react";
import { NationCardStatus } from "../../types/carte-nation.types";
import { Search } from "lucide-react";

const StatutCardTab: React.FC = () => {
  const {
    card_nation: { filters },
    setFilter,
    setPagination,
  } = useDashboardStore();

  const handleStatusChange = (key: NationCardStatus) => {
    setFilter("card_nation", "status", key);
    setPagination("card_nation", 1, 10);
  };

  const handleInstitutionChange = (key: string | null) => {
    setFilter("card_nation", "institution", key);
    setPagination("card_nation", 1, 10);
  };

  const listStatus: { key: NationCardStatus; label: string }[] = [
    {
      key: "ACTIVE",
      label: "Activé",
    },
    {
      key: "REVOKED",
      label: "Révoquée",
    },
    {
      key: "SUSPENDED",
      label: "Suspendue",
    },
  ];

  return (
    <div className="mb-6 w-full">
      <div className="flex items-center w-full">
        <Search className="text-[#9E9E9E] ml-3 sm:ml-4" size={18} />
        <input
          type="text"
          value={(filters?.institution || "") as string}
          onChange={(e) => handleInstitutionChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleInstitutionChange(e.currentTarget.value);
            }
          }}
          placeholder={"Rechercher l'institution ici ..."}
          className="w-full px-2 sm:px-3 font-light py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
        />
      </div>
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

export default StatutCardTab;
