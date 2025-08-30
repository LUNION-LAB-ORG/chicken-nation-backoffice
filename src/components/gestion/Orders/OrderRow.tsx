import Checkbox from "@/components/ui/Checkbox";
import { type Order } from "./OrdersTable";
import { Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import OrderContextMenu from "./OrderContextMenu";
import Image from "next/image";
import { createPortal } from "react-dom";
import PaymentBadge, { PaymentStatus } from "./PaymentBadge";

interface OrderRowProps {
  order: Order;
  isSelected: boolean;
  onSelect?: (orderId: string, checked: boolean) => void; // ✅ Optionnel pour contrôle RBAC
  onAccept?: (orderId: string) => void; // ✅ Optionnel pour contrôle RBAC
  onReject?: (orderId: string) => void; // ✅ Optionnel pour contrôle RBAC
  onViewDetails: (order: Order) => void;
  onHideFromList?: (orderId: string) => void; // ✅ Optionnel pour contrôle RBAC
  onRemoveFromList?: (orderId: string) => void; // ✅ Optionnel pour contrôle RBAC
  isMobile?: boolean;
  showRestaurantColumn?: boolean; // ✅ Contrôler l'affichage de la colonne Restaurant
  showActionsColumn?: boolean; // ✅ Contrôler l'affichage de la colonne Actions (menu hamburger)
  paymentStatus?: PaymentStatus; // ✅ Statut de paiement pour le badge
}

const OrderTypeBadge = ({ type }: { type: Order["orderType"] }) => {
  const styles = {
    "À livrer": "bg-[#FBDBA7] text-[#71717A]",
    "À table": "bg-[#CCE3FD] text-[#71717A]",
    "À récupérer": "bg-[#C9A9E9] text-white",
  };

  const getIcon = () => {
    if (type === "À livrer") return "/icons/deliver.png";
    if (type === "À table") return "/icons/store.png";
    return "/icons/resto.png";
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles[type]}`}
    >
      {type}{" "}
      <Image
        src={getIcon()}
        alt={type}
        width={15}
        height={15}
        className="ml-1"
      />
    </span>
  );
};

const StatusBadge = ({ order }: { order: Order }) => {
  const styles = {
    NOUVELLE: "text-[#007AFF]",
    "EN COURS": "text-[#F5A524]",
    "EN PRÉPARATION": "text-[#F5A524]",
    LIVRÉ: "text-[#17C964]",
    COLLECTÉ: "text-[#17C964]",
    ANNULÉE: "text-[#090909]",
    LIVRAISON: "text-red-600",
    PRÊT: "text-[#17C964]",
    TERMINÉ: "text-[#17C964]",
  };

  // ✅ Utiliser statusDisplayText si disponible, sinon fallback sur status
  const displayText = order.statusDisplayText || order.status;

  return (
    <span className={`font-medium text-sm ${styles[order.status]}`}>
      {displayText}
    </span>
  );
};

// Fonction utilitaire pour formater l'adresse
const formatAddress = (addressString: string) => {
  try {
    const addressObj = JSON.parse(addressString);
    // Pour l'affichage court, on ne prend que la ville
    const shortDisplay = addressObj.city || "Ville non disponible";

    // Pour le tooltip, on garde l'adresse complète
    const fullParts = [];
    if (addressObj.formattedAddress) {
      return {
        short: shortDisplay,
        full: addressObj.formattedAddress,
      };
    }

    if (addressObj.title) fullParts.push(addressObj.title);
    if (addressObj.address || addressObj.road)
      fullParts.push(addressObj.address || addressObj.road);
    if (addressObj.city) fullParts.push(addressObj.city);
    if (addressObj.postalCode) fullParts.push(addressObj.postalCode);

    return {
      short: shortDisplay,
      full: fullParts.join(", ") || "Adresse non disponible",
    };
  } catch {
    // Si l'adresse n'est pas un JSON valide, retourner l'adresse brute
    return {
      short:
        addressString.length > 20
          ? addressString.substring(0, 20) + "..."
          : addressString,
      full: addressString,
    };
  }
};

export function OrderRow({
  order,
  isSelected,
  onSelect,
  onAccept,
  onReject,
  onViewDetails,
  onHideFromList,
  onRemoveFromList,
  isMobile = false,
  showRestaurantColumn = true,
  showActionsColumn = true,
  paymentStatus = "PAID",
}: OrderRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // S'assurer que le portail est rendu dans le body
    setPortalContainer(document.body);
  }, []);

  const renderMenu = () => {
    if (!menuOpen || !portalContainer || !buttonRef.current) return null;

    // Calculer la position du menu par rapport au bouton
    const buttonRect = buttonRef.current.getBoundingClientRect();

    return createPortal(
      <div
        className="fixed"
        style={{
          position: "absolute",
          top: `${buttonRect.bottom + window.scrollY}px`,
          left: `${buttonRect.right - 224 + window.scrollX}px`, // 224px = largeur du menu (w-56)
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <OrderContextMenu
          order={order}
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onAccept={onAccept}
          onReject={onReject}
          onViewDetails={onViewDetails}
          onHideFromList={onHideFromList}
          onRemoveFromList={onRemoveFromList}
        />
      </div>,
      portalContainer
    );
  };

  if (isMobile) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100">
        <div className="flex items-start gap-3">
          {onSelect && (
            <div className="pt-1">
              <Checkbox
                checked={isSelected}
                onChange={(checked) => onSelect(order.id, checked)}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium text-black">
                  {order.reference}
                </div>
                <div className="text-xs text-gray-500">{order.date}</div>
              </div>
              <OrderTypeBadge type={order.orderType} />
            </div>
            <div className="mb-3">
              <div className="font-medium text-black">
                {order.clientName}
              </div>
              <div className="text-xs text-gray-500">
                {order.restaurant || "Restaurant inconnu"}
              </div>
              <div
                className="text-xs text-gray-500 truncate"
                title={formatAddress(order.address).full}
              >
                {formatAddress(order.address).short}
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-bold text-black">
                {(order.totalPrice || 0).toLocaleString()} F
              </div>
              <StatusBadge order={order} />
            </div>
            <div className="flex justify-between items-center mb-2">
              <PaymentBadge status={paymentStatus} />
            </div>
            {showActionsColumn && (
              <div className="flex justify-end mt-2">
                <div className="relative">
                  <button
                    ref={buttonRef}
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
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr className="hover:bg-[#FDEDD3]">
      {onSelect && (
        <td className="w-8 whitespace-nowrap py-3 px-3 sm:px-4">
          <Checkbox
            checked={isSelected}
            onChange={(checked) => onSelect(order.id, checked)}
          />
        </td>
      )}
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm font-medium text-black">
          {order.reference}
        </span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm text-gray-500">{order.date}</span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm font-medium text-black">
          {order.clientName}
        </span>
      </td>
      {/* ✅ Colonne Restaurant conditionnelle */}
      {showRestaurantColumn && (
        <td className="whitespace-nowrap py-3 px-3 sm:px-4">
          <span className="text-sm text-gray-500">
            {order.restaurant || "Restaurant inconnu"}
          </span>
        </td>
      )}
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <OrderTypeBadge type={order.orderType} />
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span
          className="text-sm text-gray-500 max-w-[200px] truncate"
          title={formatAddress(order.address).full}
        >
          {formatAddress(order.address).short}
        </span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm font-medium text-black">
          {(order.totalPrice || 0).toLocaleString()} F
        </span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <PaymentBadge status={paymentStatus} />
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <StatusBadge order={order} />
      </td>
      {showActionsColumn && (
        <td className="whitespace-nowrap py-3 px-3 sm:px-4 text-center relative">
          <button
            ref={buttonRef}
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
      )}
    </tr>
  );
}
