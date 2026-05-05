"use client";

import React from "react";
import { User } from "lucide-react";

import StatutBadge from "@/components/gestion/Livreurs/StatutBadge";
import ZoomableImage from "../common/ZoomableImage";
import { formatImageUrl } from "@/utils/imageHelpers";
import type { Livreur } from "../../types/livreur.types";

interface ProfilSectionProps {
  livreur: Livreur;
}

const ProfilSection: React.FC<ProfilSectionProps> = ({ livreur }) => {
  const avatarUrl = livreur.image ? formatImageUrl(livreur.image) : null;
  const nomComplet = `${livreur.first_name ?? ""} ${livreur.last_name ?? ""}`.trim() || "—";

  return (
    <div className="mb-6">
      <p className="text-[18px] font-medium text-[#F17922] mb-4">Profil</p>

      <div className="flex items-start gap-5">
        {/* Avatar zoomable */}
        <div className="w-28 h-28 flex-shrink-0">
          <ZoomableImage
            src={avatarUrl}
            alt="Photo de profil"
            height={112}
            className="rounded-full"
            fallback={<User className="w-10 h-10 text-[#A1A1AA]" />}
          />
        </div>

        {/* Infos principales */}
        <div className="flex-1 min-w-0 pt-2">
          <h1 className="text-2xl font-semibold text-[#18181B]">{nomComplet}</h1>
          {/* Référence métier — affichée en évidence */}
          <p className="text-sm text-[#F17922] font-mono font-semibold mt-1">
            {livreur.reference}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatutBadge status={livreur.status} isOperational={livreur.is_operational} />
            {livreur.deletion_scheduled_at && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/15">
                Suppression programmée
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilSection;
