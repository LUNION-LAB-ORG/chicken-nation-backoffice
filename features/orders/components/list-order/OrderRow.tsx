import Checkbox from "@/components/ui/Checkbox";
import { format } from "date-fns";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { OrderStatusBadge } from "../OrderStatusBadge";
import { OrderTypeBadge } from "../OrderTypeBadge";
import { OrderTable } from "../../types/ordersTable.types";
import { formatAddress } from "../../utils/formatAddress";
import OrderContextMenu from "./OrderContextMenu";
import PaymentBadge from "../PaymentBadge";
import { useOrderActions } from "../../hooks/useOrderActions";
import { PaiementStatus } from "../../types/paiement.types";

interface OrderRowProps {
  order: OrderTable;
  isSelected: boolean;
  onSelect?: (orderId: string, checked: boolean) => void;
  isMobile?: boolean;
  showRestaurantColumn?: boolean;
  onRowClick?: (order: OrderTable) => void;    // clic sur la ligne → drawer
  onViewDetails?: (order: OrderTable) => void; // "Voir les détails" du menu contextuel → drawer
}
export function OrderRow({
  order,
  isSelected,
  onSelect,
  isMobile = false,
  showRestaurantColumn = true,
  onRowClick,
  onViewDetails,
}: OrderRowProps) {
  const { handleViewOrderDetails } = useOrderActions();

  // Montant réellement payé = Σ des paiements SUCCESS (cohérent drawer/export).
  const paidAmount = (order.paiements || [])
    .filter((p) => p.status === PaiementStatus.SUCCESS)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const isFullyPaid = paidAmount > 0 && paidAmount >= (order.amount || 0);
  const paidClass = isFullyPaid
    ? "text-green-700"
    : paidAmount > 0
      ? "text-amber-600"
      : "text-gray-400";

  const [menuOpen, setMenuOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
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
          onViewDetails={onViewDetails}
        />
      </div>,
      portalContainer,
    );
  };

  if (isMobile) {
    return (
      <div
        className="bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100 cursor-pointer"
        onClick={() => onRowClick ? onRowClick(order) : undefined}
        onDoubleClick={() => !onRowClick && handleViewOrderDetails(order)}
      >
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
                <div className="font-medium text-black">{order.reference}</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
              <OrderTypeBadge type={order.orderType} />
            </div>
            <div className="mb-3">
              <div className="font-medium text-black">{order.clientName}</div>
              <div className="text-xs text-gray-500">
                {order.restaurantName}
              </div>
              <div
                className="text-xs text-gray-500 truncate"
                title={formatAddress(order.address).full}
              >
                {formatAddress(order.address).short}
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              {/* Montant : payé / total */}
              <div className="text-sm font-bold">
                <span className={`tabular-nums ${paidClass}`}>
                  {paidAmount.toLocaleString()}
                </span>
                <span className="text-gray-400 font-medium"> / </span>
                <span className="tabular-nums text-black">
                  {(order.amount || 0).toLocaleString()} F
                </span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <span
              className={`font-medium text-sm ${
                !order.auto ? "bg-amber-100" : "bg-green-100"
              } px-2 py-1 rounded-full`}
            >
              {order.auto ? "Auto" : "Manuel"}
            </span>
            <div className="flex justify-between items-center my-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  order.paymentChannel === 'Appli'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {order.paymentChannel}
                </span>
                <PaymentBadge status={order.paymentStatus} />
              </div>
            </div>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr
      className="hover:bg-[#FDEDD3] cursor-pointer"
      onClick={() => onRowClick ? onRowClick(order) : undefined}
      onDoubleClick={() => !onRowClick && handleViewOrderDetails(order)}
    >
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
        <span className="text-sm text-gray-500">
          {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
        </span>
      </td>
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm font-medium text-black">
          {order.clientName}
        </span>
      </td>
      {/* ✅ Colonne Restaurant conditionnelle */}
      {showRestaurantColumn && (
        <td className="whitespace-nowrap py-3 px-3 sm:px-4">
          <span className="text-sm text-gray-500">{order.restaurantName}</span>
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
      {/* MONTANT : payé / total (part payée colorée selon soldé/partiel) */}
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span className="text-sm font-medium">
          <span className={`tabular-nums ${paidClass}`}>
            {paidAmount.toLocaleString()}
          </span>
          <span className="text-gray-400"> / </span>
          <span className="tabular-nums text-black">
            {(order.amount || 0).toLocaleString()} F
          </span>
        </span>
      </td>
      {/* SOURCE (Auto/Manuel) — déplacée AVANT Paiement */}
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <span
          className={`font-medium text-sm ${
            !order.auto ? "bg-amber-100" : "bg-green-100"
          } px-2 py-1 rounded-full`}
        >
          {order.auto ? "Auto" : "Manuel"}
        </span>
      </td>
      {/* STATUT — déplacé AVANT Paiement */}
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <OrderStatusBadge status={order.status} />
      </td>
      {/* PAIEMENT (canal + badge payé/non payé) */}
      <td className="whitespace-nowrap py-3 px-3 sm:px-4">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            order.paymentChannel === 'Appli'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {order.paymentChannel}
          </span>
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </td>
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
    </tr>
  );
}
