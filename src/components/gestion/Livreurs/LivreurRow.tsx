"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

import LivreurContextMenu from "./LivreurContextMenu";
import StatutBadge from "./StatutBadge";
import { formatImageUrl } from "@/utils/imageHelpers";
import type { Livreur } from "../../../../features/livreurs/types/livreur.types";
import type { IDelivererLive } from "../../../../features/livreurs/types/deliverer-live.type";
import {
  COULEURS_ETAT,
  etatLivreurAffiche,
  presenceAppli,
} from "../../../../features/livreurs/utils/disponibilite";
import { PresenceAppliLigne } from "../../../../features/livreurs/components/PresenceAppliLigne";

interface LivreurRowProps {
  livreur: Livreur;
  live?: IDelivererLive;
  onView: () => void;
}

const vehiculeLabel: Record<string, string> = {
  MOTO: "Moto",
  VELO: "Vélo",
  VOITURE: "Voiture",
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

const LivreurRow: React.FC<LivreurRowProps> = ({ livreur, live, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  const renderMenu = () => {
    if (!menuOpen || !portalContainer || !buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    return createPortal(
      <div
        style={{
          position: "absolute",
          top: `${rect.bottom + window.scrollY}px`,
          left: `${rect.right - 224 + window.scrollX}px`, // 224px = largeur du menu (w-56)
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <LivreurContextMenu
          livreur={livreur}
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onViewDetails={onView}
        />
      </div>,
      portalContainer,
    );
  };

  const avatarUrl = livreur.image ? formatImageUrl(livreur.image) : null;
  const nomComplet =
    `${livreur.first_name ?? ""} ${livreur.last_name ?? ""}`.trim() || "—";

  /* ── Colonne Dispo ── */
  // État par la règle unique du serveur : « En pause jusqu'à 14 h 32 »,
  // « Hors service »… La carte (relue toutes les 15 s) passe avant la liste,
  // pour l'état comme pour l'appli (« Appli fermée · vue il y a 6 min »,
  // « En arrière-plan »).
  const renderDispo = () => {
    const maintenant = new Date();
    const source = live ?? livreur;
    const affiche = etatLivreurAffiche(
      {
        disponibilite: live?.disponibilite ?? livreur.disponibilite,
        availability: live?.availability,
        pause_until: live?.pause_until,
        auto_pause_until: live?.auto_pause_until,
        appli_active: source.appli_active,
      },
      maintenant,
    );
    if (!affiche || affiche.etat === "INACTIF") {
      return <StatutBadge status={livreur.status} isOperational={livreur.is_operational} />;
    }
    const couleurs = COULEURS_ETAT[affiche.etat];
    const appli = presenceAppli(source, affiche.etat, maintenant);
    return (
      <div className="flex flex-col gap-0.5" title={affiche.raison ?? undefined}>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit"
          style={{ color: couleurs.texte, backgroundColor: couleurs.fond }}
        >
          {affiche.libelle}
        </span>
        {affiche.etat === "EN_COURSE" && live?.active_course?.reference && (
          <span className="text-[10px] text-[#007AFF] pl-0.5 font-mono">
            {live.active_course.reference}
          </span>
        )}
        {appli && (
          <PresenceAppliLigne
            presence={appli}
            sansLibelle={affiche.etat === "APPLI_FERMEE"}
            petit
            className="pl-0.5"
          />
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
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className="livreur-menu-button p-1.5 rounded-md hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B] transition-colors"
          aria-label="Actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {renderMenu()}
      </td>
    </tr>
  );
};

export default LivreurRow;
