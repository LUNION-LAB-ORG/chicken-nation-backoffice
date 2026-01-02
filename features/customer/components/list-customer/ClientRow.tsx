import React, { useEffect, useRef, useState } from "react";
import Checkbox from "@/components/ui/Checkbox";
import { StatusBadge } from "../StatusBadge";
import { Menu } from "lucide-react";
import { Customer } from "../../types/customer.types";
import { createPortal } from "react-dom";
import ClientContextMenu from "./ClientContextMenu";
import { dateToLocalString } from "../../../../utils/date/format-date";

interface ClientRowProps {
  client: Customer;
  isSelected: boolean;
  onSelect?: (clientId: string, checked: boolean) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isHighlighted?: boolean;
  isMobile?: boolean;
}

export function ClientRow({
  client,
  isSelected,
  onSelect,
  onClick,
  onDoubleClick,
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
        <ClientContextMenu
          client={client}
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
  const formattedCreationDate = client.created_at
    ? dateToLocalString(new Date(client.created_at))
    : "---";
  const formattedLastOrderDate =
    client?.orders && client.orders.length > 0
      ? dateToLocalString(new Date(client.orders[0].created_at))
      : "---";

  const fullName = `${client.first_name || ""} ${
    client.last_name || ""
  }`.trim();
  const displayName = fullName || client.phone || client.email;

  // Version mobile (card)
  if (isMobile) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100 ${highlightClass}`}
        onClick={handleClick}
        onDoubleClick={onDoubleClick}
      >
        <div className="flex items-start gap-3">
          {onSelect && (
            <div className="pt-1 checkbox-wrapper">
              <Checkbox
                checked={isSelected}
                onChange={(checked) => onSelect(client.id, checked)}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div
                  className={`font-medium ${
                    fullName ? "text-gray-900" : "text-red-600"
                  }`}
                >
                  {displayName}
                </div>
                <div className="text-xs text-gray-500">
                  {formattedCreationDate}
                </div>
              </div>
              <StatusBadge status={"online"} />
            </div>
            <div className="flex flex-col gap-1">
              <div>
                <span className="text-gray-500">Commandes: </span>
                <span className="font-medium text-gray-900">
                  {client?.orders?.length || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Dernière: </span>
                <span className="text-gray-700">{formattedLastOrderDate}</span>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  className="p-1.5 text-gray-500 hover:text-[#F17922] rounded-lg hover:bg-orange-100 menu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                >
                  <Menu size={20} />
                </button>
                {renderMenu()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Version desktop (tableau)
  return (
    <tr
      className={`hover:bg-[#F17922]/10 cursor-pointer transition-colors ${highlightClass}`}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    >
      {onSelect && (
        <td className="w-8 whitespace-nowrap py-3 px-3 sm:px-4 checkbox-wrapper">
          <Checkbox
            checked={isSelected}
            onChange={(checked) => onSelect(client.id, checked)}
          />
        </td>
      )}
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span
          className={`text-sm ${fullName ? "text-gray-900" : "text-red-600"}`}
        >
          {displayName}
        </span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm text-gray-500">{formattedCreationDate}</span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <StatusBadge status={"online"} />
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm text-gray-500">
          {client?.orders?.length || 0}
        </span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm text-gray-500">{formattedLastOrderDate}</span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4 text-center relative">
        <button
          ref={buttonRef}
          type="button"
          className="p-1 text-[#71717A] cursor-pointer hover:text-gray-700 rounded-lg hover:bg-orange-200 menu-button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <Menu size={20} />
        </button>
        {renderMenu()}
      </td>
    </tr>
  );
}
