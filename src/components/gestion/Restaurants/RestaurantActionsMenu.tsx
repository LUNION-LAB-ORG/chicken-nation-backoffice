"use client";

import React from "react";
import { HasPermission } from "../../../../features/users/components/HasPermission";
import { Action, Modules } from "../../../../features/users/types/auth.type";

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
  return (
    <div
      className="bg-white rounded-xl shadow-lg px-0 py-0 min-w-[200px] border border-[#ECECEC] select-none z-[120]"
      style={{ boxShadow: "0 4px 28px 0 rgba(44, 44, 44, 0.10)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <HasPermission module={Modules.RESTAURANTS} action={Action.READ}>
        <button
          type="button"
          className="w-full text-[#484848] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#F7F7F7] rounded-t-xl outline-none flex items-center"
          onClick={onView}
        >
          Voir le restaurant
        </button>
      </HasPermission>
      <HasPermission module={Modules.RESTAURANTS} action={Action.UPDATE}>
        <button
          type="button"
          className="w-full text-[#484848] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#F7F7F7] outline-none flex items-center"
          onClick={onEdit}
        >
          Modifier le restaurant
        </button>
      </HasPermission>
      <HasPermission module={Modules.RESTAURANTS} action={Action.DELETE}>
        <button
          type="button"
          className="w-full text-[#F04438] text-[14px] cursor-pointer text-left font-semibold px-4 py-2.5 hover:bg-[#FFF3F2] rounded-b-xl outline-none flex items-center"
          onClick={onDelete}
        >
          Supprimer le restaurant
        </button>
      </HasPermission>
    </div>
  );
}
