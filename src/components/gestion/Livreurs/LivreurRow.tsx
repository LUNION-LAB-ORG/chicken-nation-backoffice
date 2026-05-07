"use client";

import Image from "next/image";
import React from "react";
import { MoreHorizontal } from "lucide-react";

import StatutBadge from "./StatutBadge";
import { formatImageUrl } from "@/utils/imageHelpers";
import type { Livreur } from "../../../../features/livreurs/types/livreur.types";
import type { IDelivererLive, IDelivererAvailability } from "../../../../features/livreurs/types/deliverer-live.type";

interface LivreurRowProps {
  livreur: Livreur;
  live?: IDelivererLive;
  onView: () => void;
  onMenu: () => void;
}

const vehiculeLabel: Record<string, string> = {
  MOTO: "Moto",
  VELO: "Vélo",
  VOITURE: "Voiture",
};

interface AvailabilityConfig {
  label: string;
  color: string;
  bg: string;
}

const availabilityConfig: Record<IDelivererAvailability, AvailabilityConfig> = {
  available: { label: "Disponible", color: "#17C964", bg: "rgba(23,201,100,0.15)" },
  in_course: { label: "En course", color: "#007AFF", bg: "rgba(0,122,255,0.15)" },
  paused: { label: "Pause", color: "#F5A524", bg: "rgba(245,165,36,0.15)" },
  auto_paused: { label: "Auto-pause", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  offline: { label: "Hors-ligne", color: "#9CA3AF", bg: "rgba(156,163,175,0.15)" },
};

function formatGpsAge(locationAt: string): string {
  const diffMs = Date.now() - new Date(locationAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) {
    return `Il y a ${diffMin}m`;
  }
  const diffH = Math.floor(diffMin / 60);
  return `Il y a ${diffH}h`;
}

const LivreurRow: React.FC<LivreurRowProps> = ({ livreur, live, onView, onMenu }) => {
  const avatarUrl = livreur.image ? formatImageUrl(livreur.image) : null;
  const nomComplet =
    `${livreur.first_name ?? ""} ${livreur.last_name ?? ""}`.trim() || "—";

  /* ── Colonne Dispo ── */
  const renderDispo = () => {
    if (!live) {
      return <StatutBadge status={livreur.status} isOperational={livreur.is_operational} />;
    }
    const cfg = availabilityConfig[live.availability];
    return (
      <div className="flex flex-col gap-0.5">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit"
          style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
          {cfg.label}
        </span>
        {live.availability === "in_course" && live.active_course?.reference && (
          <span className="text-[10px] text-[#007AFF] pl-0.5 font-mono">
            {live.active_course.reference}
          </span>
        )}
      </div>
    );
  };

  /* ── Colonne File ── */
  const renderFile = () => {
    if (!live || live.queue_rank === null) {
      return <span className="text-[#A1A1AA]">—</span>;
    }
    return (
      <span className="text-sm font-bold text-[#18181B]">#{live.queue_rank}</span>
    );
  };

  /* ── Colonne GPS ── */
  const renderGps = () => {
    if (!live || !live.location_at) {
      return <span className="text-[#A1A1AA]">—</span>;
    }
    if (!live.location_fresh) {
      return (
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.15)" }}
        >
          Expiré
        </span>
      );
    }
    return (
      <span className="text-xs text-[#52525B]">{formatGpsAge(live.location_at)}</span>
    );
  };

  return (
    <tr
      className="group border-b border-[#F4F4F5] hover:bg-[#FFF7F2] cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* 1. Livreur */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={nomComplet}
                width={40}
                height={40}
                className="object-cover"
              />
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

      {/* 2. Restaurant */}
      <td className="py-3 px-4 text-sm text-[#52525B]">
        {livreur.restaurant?.name ?? (
          <span className="text-[#A1A1AA] italic">Non affecté</span>
        )}
      </td>

      {/* 3. Véhicule */}
      <td className="py-3 px-4 text-sm text-[#52525B]">
        {livreur.type_vehicule ? vehiculeLabel[livreur.type_vehicule] ?? livreur.type_vehicule : "—"}
      </td>

      {/* 4. Dispo */}
      <td className="py-3 px-4">{renderDispo()}</td>

      {/* 5. File */}
      <td className="py-3 px-4">{renderFile()}</td>

      {/* 6. GPS */}
      <td className="py-3 px-4">{renderGps()}</td>

      {/* 7. Statut compte */}
      <td className="py-3 px-4">
        <StatutBadge status={livreur.status} isOperational={livreur.is_operational} />
      </td>

      {/* 8. Actions */}
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
