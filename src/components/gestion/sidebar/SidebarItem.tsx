"use client";

import React from "react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active = false,
  onClick,
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
    {icon}
    <span className={`text-sm ${active ? "text-white" : "text-gray-600"}`}>
      {label}
    </span>
  </button>
);
