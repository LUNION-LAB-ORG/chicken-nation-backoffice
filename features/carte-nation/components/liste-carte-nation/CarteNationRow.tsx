import Checkbox from "@/components/ui/Checkbox";
import { formatImageUrl } from "@/utils/imageHelpers";
import { Menu, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { dateToLocalString } from "../../../../utils/date/format-date";
import { NationCard } from "../../types/carte-nation.types";
import { getStatusBadgeCard } from "../../utils/getStatusBadgeCard";
import CarteNationContextMenu from "./CarteNationContextMenu";

interface ClientRowProps {
  carteNation: NationCard;
  isSelected: boolean;
  onSelect?: (carteNationId: string, checked: boolean) => void;
  onClick?: () => void;
  isHighlighted?: boolean;
  isMobile?: boolean;
}

export function CarteNationRow({
  carteNation,
  isSelected,
  onSelect,
  onClick,
  isHighlighted = false,
  isMobile = false,
}: ClientRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  const renderMenu = () => {
    if (!menuOpen || !portalContainer || !buttonRef.current) return null;

    const buttonRect = buttonRef.current.getBoundingClientRect();

    return createPortal(
      <div
        className="fixed"
        style={{
          position: "absolute",
          top: `${buttonRect.bottom + window.scrollY}px`,
          left: `${buttonRect.right - 224 + window.scrollX}px`,
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CarteNationContextMenu
          carteNation={carteNation}
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      </div>,
      portalContainer
    );
  };

  // Gérer le clic sur la ligne (éviter le déclenchement via checkbox)
  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".checkbox-wrapper")) return;
    onClick?.();
  };

  const highlightClass = isHighlighted ? "bg-orange-50" : "";
  const formattedDate = carteNation.created_at
    ? dateToLocalString(new Date(carteNation.created_at))
    : "---";

  const fullName = `${carteNation?.customer?.first_name || ""} ${
    carteNation?.customer?.last_name || ""
  }`.trim();
  const displayName =
    fullName || carteNation?.customer?.phone || "Client inconnu";

  if (isMobile) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100 ${highlightClass}`}
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          {onSelect && (
            <div className="pt-1 checkbox-wrapper">
              <Checkbox
                checked={isSelected}
                onChange={(checked) => onSelect(carteNation.id, checked)}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-gray-900">{displayName}</div>
                <div className="text-xs font-mono text-orange-600">
                  {carteNation.card_number}
                </div>
              </div>
              {getStatusBadgeCard(carteNation.status)}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">
                {carteNation.card_request?.institution || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Émise le {formattedDate}</span>
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 hover:bg-orange-100 rounded-lg"
              >
                <Menu size={18} />
              </button>
            </div>
            {renderMenu()}
          </div>
        </div>
      </div>
    );
  }
  return (
    <tr
      className={`hover:bg-orange-50/50 cursor-pointer border-b border-gray-50 transition-colors ${highlightClass}`}
      onClick={handleClick}
    >
      <td className="py-3 px-4 checkbox-wrapper">
        <Checkbox
          checked={isSelected}
          onChange={(checked) => onSelect?.(carteNation.id, checked)}
        />
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {carteNation?.customer?.image ? (
            <img
              src={formatImageUrl(carteNation.customer.image)}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 rounded-full object-cover" />
          )}
          <span className="text-sm font-medium text-gray-900">
            {displayName}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 font-mono text-sm text-gray-600">
        {carteNation.card_number}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {carteNation.card_request?.institution || "---"}
      </td>
      <td className="py-3 px-4">{getStatusBadgeCard(carteNation.status)}</td>
      <td className="py-3 px-4 text-sm text-gray-500">{formattedDate}</td>
      <td className="py-3 px-4 text-center relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-2 text-gray-400 hover:text-orange-600"
        >
          <Menu size={20} />
        </button>
        {renderMenu()}
      </td>
    </tr>
  );
}
