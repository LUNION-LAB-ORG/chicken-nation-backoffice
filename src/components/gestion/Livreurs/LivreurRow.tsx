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
import { rangDuLivreur } from "../../../../features/livreurs/utils/livreurs-du-jour";
import { useDroitsLivraison } from "../../../../features/livreurs/hook/use-droits-livraison";
import { PresenceAppliLigne } from "../../../../features/livreurs/components/PresenceAppliLigne";
import BoutonAppelerLivreur from "../../../../features/calls/components/BoutonAppelerLivreur";
import { livreurAppelable, nomLivreur, sousTitreLivreur } from "../../../../features/calls/utils/appel-livreur";

interface LivreurRowProps {
  livreur: Livreur;
  live?: IDelivererLive;
  onView: () => void;
  /** Un seul restaurant filtré : la place dans la file d'un serveur plus ancien est juste. */
  unSeulRestaurant?: boolean;
}

const vehiculeLabel: Record<string, string> = {
  MOTO: "Moto",
  VELO: "Vélo",
  VOITURE: "Voiture",
};

/** « #1 », « #2 » : place dans la file (colonne « File »). */
const place = (rang: number): string => `#${rang}`;

/** Âge de la dernière position (colonne « GPS ») : « Il y a 6m », « Il y a 2h ». */
function formatGpsAge(locationAt: string): string {
  const diffMs = Date.now() - new Date(locationAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) {
    return `Il y a ${diffMin}m`;
  }
  const diffH = Math.floor(diffMin / 60);
  return `Il y a ${diffH}h`;
}

const LivreurRow: React.FC<LivreurRowProps> = ({ livreur, live, onView, unSeulRestaurant = false }) => {
  // Menu ⋮ (valider, réactiver) : seulement pour qui gère les livreurs (l'admin).
  const { gererLivreurs } = useDroitsLivraison();
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
    `${livreur.first_name ?? ""} ${livreur.last_name ?? ""}`.trim() || livreur.phone || "Livreur";

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

  /* ── Colonne File : place dans la file de son restaurant ── */
  const renderFile = () => {
    const rang = live ? rangDuLivreur(live, unSeulRestaurant) : null;
    if (!rang) return null;
    return <span className="text-sm font-bold text-[#18181B]">{place(rang)}</span>;
  };

  /* ── Colonne GPS : âge de la dernière position, ou « Expiré » ── */
  const renderGps = () => {
    if (!live || !live.location_at) return null;
    if (!live.location_fresh) {
      return (
        <span
          className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.15)" }}
          title={`Dernier GPS : ${formatGpsAge(live.location_at)}`}
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
        {livreur.type_vehicule ? vehiculeLabel[livreur.type_vehicule] ?? livreur.type_vehicule : ""}
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

      {/* 8. Actions : appeler dans l'appli (service client, admin), menu */}
      <td className="py-3 px-4 text-right">
        <div className="inline-flex items-center gap-1.5">
          {livreurAppelable(livreur.entity_status) && (
            <BoutonAppelerLivreur
              variante="icone"
              delivererId={livreur.id}
              nom={nomLivreur(livreur) ?? "Livreur"}
              detail={sousTitreLivreur(livreur.restaurant?.name)}
            />
          )}
          {gererLivreurs && (
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
          )}
        </div>
        {gererLivreurs && renderMenu()}
      </td>
    </tr>
  );
};

export default LivreurRow;
