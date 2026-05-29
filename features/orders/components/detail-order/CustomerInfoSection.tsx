import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatAddress } from "../../utils/orderUtils";
import { OrderTable } from "../../types/ordersTable.types";
import { useQuery } from "@tanstack/react-query";
import { getAllOrders } from "../../services/order-service";
import { mapApiOrderToUiOrder } from "../../utils/orderMapper";
import { ShoppingBag, ChevronDown, ChevronUp, X, MapPin } from "lucide-react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import SafeImage from "@/components/ui/SafeImage";
import { format } from "date-fns";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { clientHouseMarkerIcon } from "../../../maps/components/marker-icons";

/**
 * Extrait les coordonnées GPS de l'adresse brute (JSON) de la commande.
 * Le backend stocke `Order.address` en JSON `{ ..., latitude, longitude }`.
 * Garde stricte (nombres finis + bornes Google Maps) → safe à passer à la carte
 * sans risquer un `InvalidValueError`. `null` → pas de carte (ex. à table).
 */
function parseClientCoords(rawAddress: string | null): { lat: number; lng: number } | null {
  if (!rawAddress) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(rawAddress);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const rawLat = o.latitude ?? o.lat;
  const rawLng = o.longitude ?? o.lng;
  const lat = typeof rawLat === "string" ? Number(rawLat) : rawLat;
  const lng = typeof rawLng === "string" ? Number(rawLng) : rawLng;
  if (typeof lat !== "number" || !Number.isFinite(lat)) return null;
  if (typeof lng !== "number" || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;
  return { lat, lng };
}

interface CustomerInfoSectionProps {
  order: OrderTable;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ order }) => {
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // ── Carte client dépliable ─────────────────────────────────────────────
  const { isScriptLoaded } = useGoogleMaps();
  const [mapOpen, setMapOpen] = useState(false);
  // Montée paresseuse : on ne crée la GoogleMap qu'au premier dépliage (et on
  // la garde ensuite montée pour que replier/déplier reste fluide).
  const [mapMounted, setMapMounted] = useState(false);
  const clientMapRef = useRef<google.maps.Map | null>(null);

  const clientCoords = useMemo(() => parseClientCoords(order.rawAddress), [order.rawAddress]);
  const houseIcon = useMemo(
    () => (isScriptLoaded ? clientHouseMarkerIcon() : undefined),
    [isScriptLoaded],
  );

  const toggleMap = () => {
    setMapOpen((open) => {
      if (!open) setMapMounted(true);
      return !open;
    });
  };

  // Après le dépliage, on recadre une fois la transition finie — évite les
  // tuiles grises si la carte s'est montée pendant que le conteneur grandissait.
  useEffect(() => {
    if (!mapOpen || !clientCoords) return;
    const id = window.setTimeout(() => {
      clientMapRef.current?.setCenter(clientCoords);
    }, 320);
    return () => window.clearTimeout(id);
  }, [mapOpen, clientCoords]);

  // Fetch customer order count
  const { data: customerOrdersData } = useQuery({
    queryKey: ["orders", "customer-count", order.customerId],
    queryFn: () => getAllOrders({ customerId: order.customerId, limit: 1, page: 1, startDate: "01/01/2020", endDate: "31/12/2099" }),
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

      {/* Carte client — dropdown qui déplie/replie la localisation de livraison,
          au-dessus de l'adresse. N'apparaît que si la commande a des coords. */}
      {clientCoords && (
        <div className="mb-4">
          <button
            type="button"
            onClick={toggleMap}
            aria-expanded={mapOpen}
            className="w-full flex items-center justify-between py-1.5 cursor-pointer group"
          >
            <span className="flex items-center gap-1.5 text-sm text-[#71717A]">
              <MapPin className="w-4 h-4 text-[#F17922]" />
              Localisation
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#F17922] group-hover:text-[#D96A1D] transition-colors">
              {mapOpen ? "Masquer la carte" : "Voir sur la carte"}
              {mapOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {/* Pli/dépli fluide via grid-template-rows (0fr ↔ 1fr). */}
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              mapOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="pt-2">
                {isScriptLoaded && mapMounted ? (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "200px", borderRadius: "14px" }}
                    center={clientCoords}
                    zoom={16}
                    onLoad={(map) => {
                      clientMapRef.current = map;
                    }}
                    onUnmount={() => {
                      clientMapRef.current = null;
                    }}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                      clickableIcons: false,
                      gestureHandling: "cooperative",
                      styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
                    }}
                  >
                    <MarkerF position={clientCoords} icon={houseIcon} />
                  </GoogleMap>
                ) : (
                  <div className="h-[200px] bg-gray-50 rounded-[14px] animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
    queryFn: () => getAllOrders({ customerId, limit: 10, page, sortBy: "created_at", sortOrder: "desc", startDate: "01/01/2020", endDate: "31/12/2099" }),
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
                            o.status === "RÉCUPÉRÉE" || o.status === "TERMINÉE" ? "bg-green-100 text-green-700" :
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
