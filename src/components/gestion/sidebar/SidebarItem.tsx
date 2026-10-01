"use client";

import React from "react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  /** Pastille sur l'icône (ex. commandes à relancer), même rendu que les entrées à sous-menu. */
  badge?: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active = false,
  onClick,
  badge,
}) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center space-x-3 px-4 py-[10px] rounded-[14px]
      ${
        active
          ? "bg-linear-to-r from-[#F17922] to-[#FA6345]"
          : "text-gray-600 hover:bg-gray-100"
      }
      transition-all duration-200
    `}
  >
    <span className="relative inline-flex">
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </span>
    <span className={`text-sm ${active ? "text-white" : "text-gray-600"}`}>
      {label}
    </span>
  </button>
);
