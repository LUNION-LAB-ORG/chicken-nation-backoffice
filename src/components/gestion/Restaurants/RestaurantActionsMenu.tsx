"use client";

import React from "react";
import { useRBAC } from "@/hooks/useRBAC";

interface RestaurantActionsMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function RestaurantActionsMenu({
  onView,
  onEdit,
  onDelete,
}: Omit<RestaurantActionsMenuProps, "onClose">) {
  const { canViewRestaurant, canUpdateRestaurant, canDeleteRestaurant } =
    useRBAC();

  return (
    <div
      className="bg-white rounded-xl shadow-lg px-0 py-0 min-w-[200px] border border-[#ECECEC] select-none z-[120]"
      style={{ boxShadow: "0 4px 28px 0 rgba(44, 44, 44, 0.10)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {canViewRestaurant && (
        <button
          type="button"
          className="w-full text-[#484848] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#F7F7F7] rounded-t-xl outline-none flex items-center"
          onClick={onView}
        >
          Voir le restaurant
        </button>
      )}
      {canUpdateRestaurant && (
        <button
          type="button"
          className="w-full text-[#484848] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#F7F7F7] outline-none flex items-center"
          onClick={onEdit}
        >
          Modifier le restaurant
        </button>
      )}
      {canDeleteRestaurant && (
        <button
          type="button"
          className="w-full text-[#F04438] text-[14px] cursor-pointer text-left font-semibold px-4 py-2.5 hover:bg-[#FFF3F2] rounded-b-xl outline-none flex items-center"
          onClick={onDelete}
        >
          Supprimer le restaurant
        </button>
      )}
    </div>
  );
}
