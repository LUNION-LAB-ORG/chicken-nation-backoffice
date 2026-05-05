"use client";

import Image from "next/image";
import React from "react";
import { MoreHorizontal } from "lucide-react";

import StatutBadge from "./StatutBadge";
import { formatImageUrl } from "@/utils/imageHelpers";
import type { Livreur } from "../../../../features/livreurs/types/livreur.types";

interface LivreurRowProps {
  livreur: Livreur;
  onView: () => void;
  onMenu: () => void;
}

const vehiculeLabel: Record<string, string> = {
  MOTO: "Moto",
  VELO: "Vélo",
  VOITURE: "Voiture",
};

const LivreurRow: React.FC<LivreurRowProps> = ({ livreur, onView, onMenu }) => {
  const avatarUrl = livreur.image ? formatImageUrl(livreur.image) : null;
  const nomComplet = `${livreur.first_name ?? ""} ${livreur.last_name ?? ""}`.trim() || "—";

  return (
    <tr
      className="group border-b border-[#F4F4F5] hover:bg-[#FFF7F2] cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* Avatar + nom */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={nomComplet} width={40} height={40} className="object-cover" />
            ) : (
              <span className="text-xs text-[#A1A1AA] font-bold">
                {nomComplet.charAt(0).toUpperCase() || "L"}
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#18181B]">{nomComplet}</div>
            <div className="text-xs text-[#71717A]">{livreur.phone}</div>
          </div>
        </div>
      </td>

      <td className="py-3 px-4 text-sm text-[#52525B]">{livreur.email || "—"}</td>

      <td className="py-3 px-4 text-sm text-[#52525B]">
        {livreur.type_vehicule ? vehiculeLabel[livreur.type_vehicule] : "—"}
      </td>

      <td className="py-3 px-4 text-sm text-[#52525B]">
        {livreur.restaurant?.name ?? <span className="text-[#A1A1AA] italic">Non affecté</span>}
      </td>

      <td className="py-3 px-4">
        <StatutBadge status={livreur.status} isOperational={livreur.is_operational} />
      </td>

      <td className="py-3 px-4 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenu();
          }}
          className="p-1.5 rounded-md hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B] transition-colors"
          aria-label="Actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export default LivreurRow;
