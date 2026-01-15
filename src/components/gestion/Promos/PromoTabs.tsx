"use client";

import React from "react";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

interface PromoTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePromo?: () => void;
  className?: string;
}

const PromoTabs = ({
  activeTab,
  onTabChange,
  onCreatePromo,
  className = "",
}: PromoTabsProps) => {
  const { can } = useAuthStore();
  const tabs = [
    { id: "all", label: "Toutes les promos" },
    { id: "public", label: "Public" },
    { id: "private", label: "Privées" },
    { id: "expired", label: "Expirées" },
  ];

  const canAddPromo = can(Modules.PROMOTIONS, Action.CREATE) && onCreatePromo;

  return (
    <div className={className}>
      {/* Titre de la section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#F17922] lg:text-[26px] text-md font-regular">
          Gestions des promotions
        </h2>
        {canAddPromo && (
          <button
            type="button"
            className="lg:px-6 p-2 lg:py-2 bg-[#F17922] cursor-pointer text-white font-medium rounded-2xl hover:bg-[#F17922] text-xs lg:text-sm transition-colors"
            onClick={onCreatePromo}
          >
            Ajouter une promo
          </button>
        )}
      </div>

      {/* Onglets de filtrage */}
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              lg:px-4 p-2 py-1 cursor-pointer rounded-xl text-xs font-medium transition-all duration-200
              ${
                activeTab === tab.id
                  ? "bg-linear-to-r from-[#F17922] to-[#FA6345] text-white"
                  : "bg-white border-slate-200 border text-gray-500 hover:bg-gray-200"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromoTabs;
