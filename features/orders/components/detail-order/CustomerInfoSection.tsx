import React, { useState } from "react";
import { formatAddress } from "../../utils/orderUtils";
import { OrderTable } from "../../types/ordersTable.types";
import { useQuery } from "@tanstack/react-query";
import { getAllOrders } from "../../services/order-service";
import { mapApiOrderToUiOrder } from "../../utils/orderMapper";
import { ShoppingBag, ChevronDown, ChevronUp, X } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { format } from "date-fns";

interface CustomerInfoSectionProps {
  order: OrderTable;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ order }) => {
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Fetch customer order count
  const { data: customerOrdersData } = useQuery({
    queryKey: ["orders", "customer-count", order.customerId],
    queryFn: () => getAllOrders({ customerId: order.customerId, limit: 1, page: 1, startDate: "2020-01-01", endDate: new Date().toISOString() }),
    enabled: !!order.customerId,
  });

  const totalOrders = customerOrdersData?.meta?.total || 0;

  return (
    <div className="mb-4 md:mb-8">
      <p className="text-[18px] font-medium text-[#F17922] mb-4">Client</p>

      <div className="flex flex-row items-center justify-between mb-4">
        <p className="text-sm text-[#71717A]">Client</p>
        <p className="text-sm text-[#71717A] font-bold">{order.clientName}</p>
      </div>

      <div className="flex flex-row justify-between items-start mb-4">
        <p className="text-sm text-[#71717A]">Adresse</p>
        <p className="text-sm text-[#71717A] font-bold text-right max-w-[250px]">
          {formatAddress(order.address)}
        </p>
      </div>

      {order.clientEmail && (
        <div className="flex flex-row items-center justify-between mb-2">
          <p className="text-sm text-[#71717A]">Email</p>
          <p className="text-sm text-[#71717A] font-bold">{order.clientEmail}</p>
        </div>
      )}

      {order.clientPhone && (
        <div className="flex flex-row items-center justify-between mb-2">
          <p className="text-sm text-[#71717A]">Téléphone</p>
          <p className="text-sm text-[#71717A] font-bold">{order.clientPhone}</p>
        </div>
      )}

      {/* Customer orders count button */}
      <div className="flex flex-row items-center justify-between mt-3">
        <p className="text-sm text-[#71717A]">Commandes</p>
        <button
          onClick={() => setShowOrdersModal(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F17922] hover:text-[#D96A1D] transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {totalOrders} commande{totalOrders > 1 ? "s" : ""}
        </button>
      </div>

      {/* Orders modal */}
      {showOrdersModal && (
        <CustomerOrdersModal
          customerId={order.customerId}
          customerName={order.clientName}
          currentOrderId={order.id}
          onClose={() => setShowOrdersModal(false)}
        />
      )}
    </div>
  );
};

// ── Orders Modal ──

interface CustomerOrdersModalProps {
  customerId: string;
  customerName: string;
  currentOrderId: string;
  onClose: () => void;
}

function CustomerOrdersModal({ customerId, customerName, currentOrderId, onClose }: CustomerOrdersModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "customer-list", customerId, page],
    queryFn: () => getAllOrders({ customerId, limit: 10, page, sortBy: "created_at", sortOrder: "desc", startDate: "2020-01-01", endDate: new Date().toISOString() }),
    enabled: !!customerId,
  });

  const orders = (data?.data || []).map(mapApiOrderToUiOrder);
  const meta = data?.meta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Commandes de {customerName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {meta?.total || 0} commande{(meta?.total || 0) > 1 ? "s" : ""} au total
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Chargement...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Aucune commande</div>
          ) : (
            orders.map((o) => {
              const isExpanded = expandedId === o.id;
              const isCurrent = o.id === currentOrderId;

              return (
                <div
                  key={o.id}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    isCurrent ? "border-[#F17922]/40 bg-[#FFF8F2]" : "border-gray-100 bg-white"
                  }`}
                >
                  {/* Order row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            #{o.reference}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F17922] text-white">
                              Actuelle
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            o.status === "LIVRÉE" || o.status === "TERMINÉE" ? "bg-green-100 text-green-700" :
                            o.status === "ANNULÉE" ? "bg-red-100 text-red-600" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(o.createdAt), "dd/MM/yyyy HH:mm")} · {o.orderType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#F17922]">
                        {o.amount.toLocaleString()} F
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-50">
                      {/* Items */}
                      <div className="mt-3 space-y-2">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-10 h-8 rounded-md overflow-hidden shrink-0 relative">
                              <SafeImage
                                src={item.image}
                                alt={item.name}
                                width={40}
                                height={32}
                                className="object-cover"
                              />
                              {item.price === 0 && (
                                <div className="absolute bottom-0 right-0 bg-[#F17922] text-white text-[7px] px-0.5 rounded-tl">
                                  Offert
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">
                                {item.name}
                                {item.price === 0 && <span className="text-[#F17922] ml-1">(Offert)</span>}
                              </p>
                              {item.supplements && (
                                <p className="text-[10px] text-gray-400 truncate">+ {item.supplements}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">x{item.quantity}</span>
                            <span className="text-xs font-semibold text-gray-700 shrink-0">
                              {item.price === 0 ? "Offert" : `${item.price.toLocaleString()} F`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="mt-3 pt-2 border-t border-gray-50 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>Net</span>
                          <span>{o.netAmount.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Livraison</span>
                          <span>{o.deliveryFee ? `${o.deliveryFee.toLocaleString()} F` : "--"}</span>
                        </div>
                        {o.discount > 0 && (
                          <div className="flex justify-between text-red-400">
                            <span>Réduction</span>
                            <span>-{o.discount.toLocaleString()} F</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-500">
                          <span>Paiement</span>
                          <span>{o.paymentChannel}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Page {meta.page}/{meta.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPages}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerInfoSection;
