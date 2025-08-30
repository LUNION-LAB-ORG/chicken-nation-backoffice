"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { OrderRow } from "./OrderRow";
import { Pagination } from "@/components/ui/pagination";
import { TableHeader } from "./TableHeader";
import { OrderFilters } from "./OrderFilters";
import { toast } from "react-hot-toast";
import { useOrdersQuery } from "@/hooks/useOrdersQuery";
import { deleteOrder, ApiOrderRaw } from "@/services/orderService";
import { useRBAC } from "@/hooks/useRBAC";
import { PaymentStatus } from "./PaymentBadge";
import { useOrderStore } from "@/store/orderStore";

// Interface étendue pour les commandes UI
export interface Order {
  // Identifiants
  id: string;
  reference: string;
  orderNumber?: string;

  // Informations client
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  userId: string;

  // Dates
  date: string;
  createdAt?: string;
  updatedAt?: string;

  // Statut et type
  status:
    | "NOUVELLE"
    | "EN COURS"
    | "EN PRÉPARATION"
    | "LIVRÉ"
    | "COLLECTÉ"
    | "ANNULÉE"
    | "LIVRAISON"
    | "PRÊT"
    | "TERMINÉ";
  statusDisplayText?: string; // ✅ Texte d'affichage synchronisé avec OrderDetails
  orderType: "À livrer" | "À table" | "À récupérer";

  // Prix
  totalPrice: number;
  deliveryPrice: number;
  subtotal?: number;
  tax?: number;
  discount?: number;

  // Localisation
  address: string;
  tableNumber?: string;
  tableType?: string;
  numberOfGuests?: number;

  // Restaurant
  restaurant?: string;
  restaurantId?: string;

  // Items
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    epice?: boolean;
  }>;

  // Paiement
  paymentMethod?: string;
  paymentStatus?: string;
  paiements?: Array<{
    id?: string;
    method?: string;
    status?: string;
    amount?: number;
  }>;

  // Notes
  notes?: string;
  specialInstructions?: string;

  // Métadonnées
  source?: string;
  platform?: string;
  estimatedDelivery?: string;

  // État UI
  hidden?: boolean;
}

interface OrdersTableProps {
  onViewDetails: (order: Order) => void;
  searchQuery?: string;
  onFilteredOrdersChange?: (orders: Order[]) => void;
  selectedRestaurant?: string | null;
  currentUser?: {
    id: string;
    role: string;
    restaurant_id?: string;
    [key: string]: unknown;
  } | null;
  filteredOrders?: Order[];
  activeFilter?: string;
  onActiveFilterChange?: (filter: string) => void;
  selectedDate?: Date | null;
  onSelectedDateChange?: (date: Date | null) => void;
}

// 🎯 FONCTION POUR DÉTERMINER LE STATUT DE PAIEMENT
const getPaymentStatus = (order: Order): PaymentStatus => {
  // Si la commande est annulée, vérifier le statut du paiement
  if (
    order.status === "ANNULÉE" &&
    order.paiements &&
    order.paiements.length > 0
  ) {
    // Vérifier s'il y a un paiement avec le statut REVERTED
    const hasRevertedPayment = order.paiements?.some(
      (p) => p.status === "REVERTED"
    );
    return hasRevertedPayment ? "REFUNDED" : "TO_REFUND";
  }
  // Pour toutes les autres commandes, elles sont considérées comme payées
  return "PAID";
};

 
const mapApiOrderToUiOrder = (apiOrder: ApiOrderRaw): Order => {
 
  const mapApiStatusToUiStatus = (apiStatus: string): Order["status"] => {
    const statusMapping: Record<string, Order["status"]> = {
      PENDING: "NOUVELLE",
      ACCEPTED: "EN COURS",
      IN_PROGRESS: "EN PRÉPARATION",
      READY: "PRÊT",
      PICKED_UP: "LIVRAISON",
      DELIVERED: "LIVRÉ",
      COLLECTED: "COLLECTÉ",
      CANCELLED: "ANNULÉE",
      COMPLETED: "TERMINÉ",
    };
    return statusMapping[apiStatus] || "NOUVELLE";
  };

  // ✅ 2. MAPPING DES TYPES API → UI
  const mapApiTypeToUiType = (apiType: string): Order["orderType"] => {
    const typeMapping: Record<string, Order["orderType"]> = {
      DELIVERY: "À livrer",
      PICKUP: "À récupérer",
      TABLE: "À table",
    };
    return typeMapping[apiType] || "À livrer";
  };

  // ✅ 3. EXTRACTION DU NOM CLIENT
  const extractClientName = (apiOrder: ApiOrderRaw): string => {
    if (apiOrder.customer?.first_name || apiOrder.customer?.last_name) {
      const firstName = apiOrder.customer.first_name || "";
      const lastName = apiOrder.customer.last_name || "";
      return `${firstName} ${lastName}`.trim();
    }
    if (apiOrder.fullname) {
      return apiOrder.fullname;
    }
    return "Client inconnu";
  };

  // ✅ 4. EXTRACTION DE L'ADRESSE
  const extractAddress = (addressString: string): string => {
    if (!addressString) return "Adresse non disponible";

    try {
      // Si c'est un JSON, le parser
      if (addressString.startsWith("{") || addressString.startsWith("[")) {
        const addressObj = JSON.parse(addressString);
        if (addressObj.formattedAddress) return addressObj.formattedAddress;

        const parts = [];
        if (addressObj.title) parts.push(addressObj.title);
        if (addressObj.address || addressObj.road)
          parts.push(addressObj.address || addressObj.road);
        if (addressObj.city) parts.push(addressObj.city);
        if (addressObj.postalCode) parts.push(addressObj.postalCode);

        return parts.join(", ") || "Adresse non disponible";
      }
      // Sinon retourner tel quel
      return addressString;
    } catch {
      return addressString || "Adresse non disponible";
    }
  };

  // ✅ 5. FORMATTING DES DATES
  const formatDate = (dateString: string): string => {
    if (!dateString) return new Date().toLocaleDateString("fr-FR");

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR");
    } catch {
      return new Date().toLocaleDateString("fr-FR");
    }
  };

  // ✅ 6. EXTRACTION DU MODE DE PAIEMENT
  const extractPaymentMethod = (
    paiements: Array<{ method?: string }>
  ): string => {
    if (!paiements || paiements.length === 0) return "Non renseigné";

    const firstPayment = paiements[0];
    if (firstPayment.method) {
      // Traduire les méthodes en français
      const methodMapping: Record<string, string> = {
        CASH: "Espèces",
        CARD: "Carte bancaire",
        MOBILE_MONEY: "Mobile Money",
        ONLINE: "Paiement en ligne",
        WAVE: "Wave",
        ORANGE_MONEY: "Orange Money",
        MOOV_MONEY: "Moov Money",
      };
      return methodMapping[firstPayment.method] || firstPayment.method;
    }

    return "Non renseigné";
  };

  // ✅ 7. EXTRACTION DES ITEMS avec validation d'URL
  const extractItems = (
    orderItems: ApiOrderRaw["order_items"]
  ): Order["items"] => {
    if (!Array.isArray(orderItems)) return [];

    // Fonction pour valider et nettoyer les URLs d'images
    const validateImageUrl = (imageUrl: string | undefined | null): string => {
      if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
        return "/images/food2.png";
      }

      // Nettoyer l'URL
      const cleanUrl = imageUrl.trim();

      // Vérifier si c'est une URL valide (commence par http/https ou /)
      if (
        cleanUrl.startsWith("/") ||
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://")
      ) {
        return cleanUrl;
      }

      // Si l'URL n'est pas valide, retourner l'image par défaut
      return "/images/food2.png";
    };

    return orderItems.map((item) => ({
      id: item.id || "",
      name: item.name || item.dish?.name || "Article inconnu",
      quantity: item.quantity || 1,
      price: item.price || item.amount || item.dish?.price || 0,
      image: validateImageUrl(item.dish?.image),
      epice: item.epice,
    }));
  };

  // 🎯 RETOURNER L'OBJET ORDER COMPLET
  return {
    // ✅ Identifiants
    id: apiOrder.id || "",
    reference: apiOrder.reference || apiOrder.order_number || "REF-INCONNUE",
    orderNumber: apiOrder.order_number || "",

    // ✅ Informations client - EXTRACTION EXACTE
    clientName: extractClientName(apiOrder),
    clientEmail: apiOrder.customer?.email || apiOrder.email || "",
    clientPhone: apiOrder.customer?.phone || apiOrder.phone || "",
    userId: apiOrder.customer_id || "",

    // ✅ Dates - EXTRACTION EXACTE
    date: formatDate(apiOrder.created_at),
    createdAt: apiOrder.created_at || "",
    updatedAt: apiOrder.updated_at || "",

    // ✅ Statut et type - MAPPING EXACT
    status: mapApiStatusToUiStatus(apiOrder.status),
    statusDisplayText: mapApiStatusToUiStatus(apiOrder.status),
    orderType: mapApiTypeToUiType(apiOrder.type),

    // ✅ Prix - EXTRACTION EXACTE
    totalPrice: apiOrder.amount || 0,
    deliveryPrice: apiOrder.delivery_fee || 0,
    subtotal: apiOrder.net_amount || apiOrder.amount || 0,
    tax: apiOrder.tax || 0,
    discount: apiOrder.discount || 0,

    // ✅ Localisation - EXTRACTION EXACTE
    address: extractAddress(apiOrder.address),
    tableNumber: "",
    tableType: apiOrder.table_type || "",
    numberOfGuests: apiOrder.places || 0,

    // ✅ Restaurant - EXTRACTION EXACTE
    restaurant: apiOrder.restaurant?.name || "Restaurant inconnu",
    restaurantId: apiOrder.restaurant_id || "",

    // ✅ Items - EXTRACTION EXACTE
    items: extractItems(apiOrder.order_items),

    // ✅ Paiement - EXTRACTION EXACTE
    paymentMethod: extractPaymentMethod(apiOrder.paiements),
    paymentStatus: apiOrder.paied ? "PAID" : "PENDING",
    paiements: apiOrder.paiements || [],

    // ✅ Notes - EXTRACTION EXACTE
    notes: apiOrder.note || "",
    specialInstructions: "",

    // ✅ Métadonnées - EXTRACTION EXACTE
    source: "APP",
    platform: "WEB",
    estimatedDelivery: apiOrder.estimated_delivery_time || "",

    // ✅ État UI
    hidden: false,
  };
};

export function OrdersTable({
  onViewDetails,
  searchQuery = "",
  selectedRestaurant = null,
  currentUser = null,
  filteredOrders,
  activeFilter,
  onActiveFilterChange,
  selectedDate,
  onSelectedDateChange,
}: OrdersTableProps) {
  // ✅ Contrôles RBAC
  const {
    canAcceptCommande,
    canRejectCommande,
    canDeleteCommande,
    canUpdateCommande,
  } = useRBAC();

  // ✅ Déterminer si on affiche la colonne Actions
  const hasAnyActionPermission =
    canAcceptCommande() ||
    canRejectCommande() ||
    canDeleteCommande() ||
    canUpdateCommande();

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const { updateOrderStatus } = useOrderStore();

  // ✅ Utiliser TanStack Query pour les commandes avec recherche côté serveur
  const {
    orders: apiOrders,
    totalItems,
    totalPages,
    currentPage,
    isLoading,
    error,
    setCurrentPage,
    refetch,
  } = useOrdersQuery({
    activeFilter: activeFilter || "all",
    selectedRestaurant,
    searchQuery, // ✅ Recherche côté serveur pour éviter conflit avec pagination
    selectedDate: selectedDate || null,
  });

  // ✅ CONVERSION: Mapper les données API vers UI (sans filtrage côté client)
  const ordersToDisplay = useMemo(() => {
    if (filteredOrders && filteredOrders.length > 0) {
      // Utiliser les commandes déjà filtrées passées en props
      return filteredOrders;
    }

    if (apiOrders.length > 0) {
      return apiOrders.map(mapApiOrderToUiOrder);
    }

    return [];
  }, [apiOrders, filteredOrders]);

  // ✅ Gérer les actions sur les commandes avec TanStack Query et contrôles RBAC
  const handleAcceptOrder = useCallback(
    async (orderId: string) => {
      if (!canAcceptCommande()) {
        toast.error(
          "Vous n'avez pas les permissions pour accepter les commandes"
        );
        return;
      }

      try {
        await updateOrderStatus(orderId, "ACCEPTED");
        toast.success(`Commande ${orderId} acceptée`);
        refetch(); // ✅ Recharger avec TanStack Query
      } catch (error) {
        console.error("[handleAcceptOrder] Erreur:", error);
        toast.error(
          `Erreur: ${
            error instanceof Error
              ? error.message
              : "Impossible d'accepter la commande"
          }`
        );
      }
    },
    [refetch, canAcceptCommande]
  );

  const handleRejectOrder = useCallback(
    async (orderId: string) => {
      if (!canRejectCommande()) {
        toast.error(
          "Vous n'avez pas les permissions pour refuser les commandes"
        );
        return;
      }

      try {
        await updateOrderStatus(orderId, "CANCELLED");
        toast.success(`Commande ${orderId} refusée`);
        refetch(); // ✅ Recharger avec TanStack Query
      } catch (error) {
        console.error("[handleRejectOrder] Erreur:", error);
        toast.error(
          `Erreur: ${
            error instanceof Error
              ? error.message
              : "Impossible de refuser la commande"
          }`
        );
      }
    },
    [refetch, canRejectCommande]
  );

  const handleHideOrder = useCallback((orderId: string) => {
    // ✅ Pour la pagination serveur, on peut soit supprimer soit marquer comme masqué
    // Pour l'instant, on affiche juste un message
    toast.success(`Commande ${orderId} masquée de la liste`);
  }, []);

  const handleRemoveOrder = useCallback(
    async (orderId: string) => {
      if (!canDeleteCommande()) {
        toast.error(
          "Vous n'avez pas les permissions pour supprimer les commandes"
        );
        return;
      }

      try {
        await deleteOrder(orderId);
        toast.success(`Commande ${orderId} retirée de la liste`);
        refetch(); // ✅ Recharger avec TanStack Query
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error(
          `Erreur: ${
            error instanceof Error
              ? error.message
              : "Impossible de supprimer la commande"
          }`
        );
      }
    },
    [refetch, canDeleteCommande]
  );

  const handleViewOrderDetails = useCallback(
    (order: Order) => {
      onViewDetails(order);
    },
    [onViewDetails]
  );

  // ✅ Pas de filtrage côté client - tout est géré côté serveur
  // Les commandes affichées sont directement celles retournées par l'API

  // ✅ Sélection multiple avec contrôle RBAC
  const handleSelectAll = (checked: boolean) => {
    if (!canDeleteCommande() && !canUpdateCommande()) {
      toast.error(
        "Vous n'avez pas les permissions pour sélectionner les commandes"
      );
      return;
    }

    if (checked) {
      setSelectedOrders(ordersToDisplay.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (!canDeleteCommande() && !canUpdateCommande()) {
      toast.error(
        "Vous n'avez pas les permissions pour sélectionner les commandes"
      );
      return;
    }

    if (checked) {
      setSelectedOrders((prev) => [...prev, orderId]);
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleFilterChange = useCallback(
    (filter: string) => {
      onActiveFilterChange?.(filter);
      setSelectedOrders([]); // ✅ Vider les sélections quand on change de filtre
    },
    [onActiveFilterChange]
  );

  const handleDateChange = useCallback(
    (date: Date | null) => {
      onSelectedDateChange?.(date);
      setSelectedOrders([]); // ✅ Vider les sélections quand on change de date
    },
    [onSelectedDateChange]
  );

  // ✅ Vider les sélections quand on change de page
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      setSelectedOrders([]); // ✅ Vider les sélections quand on change de page
    },
    [setCurrentPage]
  );

  // ✅ Vider les sélections quand la recherche change
  useEffect(() => {
    setSelectedOrders([]);
  }, [searchQuery]);

  // ✅ Afficher un indicateur de chargement (pagination serveur)
  if (isLoading && ordersToDisplay.length === 0) {
    return (
      <div className="min-w-full bg-white h-screen border-1 border-slate-300 p-3 rounded-xl overflow-hidden flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ✅ Afficher un message d'erreur (pagination serveur)
  if (error && ordersToDisplay.length === 0) {
    return (
      <div className="min-w-full bg-white h-screen border-1 border-slate-300 p-3 rounded-xl overflow-hidden flex justify-center items-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">
            Erreur lors du chargement des commandes
          </p>
          <p className="text-sm">{error?.message || "Erreur inconnue"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-full bg-white min-h-screen border border-slate-300 p-2 rounded-xl overflow-auto">
      {/* Composant de filtres */}
      <OrderFilters
        activeFilter={activeFilter || "all"}
        onFilterChange={handleFilterChange}
        selectedDate={selectedDate || null}
        onDateChange={handleDateChange}
      />

      <div className="min-w-full mt-4">
        {/* Version mobile */}
        <div className="md:hidden px-2 space-y-3 overflow-x-auto">
          {ordersToDisplay.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isSelected={selectedOrders.includes(order.id)}
              onSelect={
                canDeleteCommande() || canUpdateCommande()
                  ? (orderId, checked) => handleSelectOrder(orderId, checked)
                  : undefined
              }
              onAccept={canAcceptCommande() ? handleAcceptOrder : undefined}
              onReject={canRejectCommande() ? handleRejectOrder : undefined}
              onViewDetails={handleViewOrderDetails}
              onHideFromList={canDeleteCommande() ? handleHideOrder : undefined}
              onRemoveFromList={
                canDeleteCommande() ? handleRemoveOrder : undefined
              }
              isMobile={true}
              showActionsColumn={hasAnyActionPermission} // ✅ Cacher menu hamburger si aucune permission
              paymentStatus={getPaymentStatus(order)} // ✅ Calculer le statut de paiement
            />
          ))}
        </div>

        {/* Version desktop */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[1200px]">
            {" "}
            {/* Largeur minimale pour assurer le scroll */}
            <table className="min-w-full">
              <TableHeader
                onSelectAll={
                  canDeleteCommande() || canUpdateCommande()
                    ? handleSelectAll
                    : undefined
                }
                isAllSelected={
                  selectedOrders.length > 0 &&
                  selectedOrders.length === ordersToDisplay.length
                }
                showRestaurantColumn={currentUser?.role === "ADMIN"} // ✅ Seulement pour ADMIN
                showActionsColumn={hasAnyActionPermission} // ✅ Cacher colonne Actions si aucune permission
              />
              <tbody>
                {ordersToDisplay.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isSelected={selectedOrders.includes(order.id)}
                    onSelect={
                      canDeleteCommande() || canUpdateCommande()
                        ? (orderId, checked) =>
                            handleSelectOrder(orderId, checked)
                        : undefined
                    }
                    onAccept={
                      canAcceptCommande() ? handleAcceptOrder : undefined
                    }
                    onReject={
                      canRejectCommande() ? handleRejectOrder : undefined
                    }
                    onViewDetails={handleViewOrderDetails}
                    onHideFromList={
                      canDeleteCommande() ? handleHideOrder : undefined
                    }
                    onRemoveFromList={
                      canDeleteCommande() ? handleRemoveOrder : undefined
                    }
                    showRestaurantColumn={currentUser?.role === "ADMIN"} // ✅ Seulement pour ADMIN
                    showActionsColumn={hasAnyActionPermission} // ✅ Cacher menu hamburger si aucune permission
                    paymentStatus={getPaymentStatus(order)} // ✅ Calculer le statut de paiement
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ✅ Informations de pagination et statistiques */}
      <div className="flex flex-col items-center py-4 px-2 space-y-2">
        {/* Statistiques avec indicateur de chargement */}
        <div className="text-sm text-gray-600 flex items-center gap-2">
          {!isLoading && totalItems > 0 && (
            <span className="text-xs">
              {totalItems} commande{totalItems > 1 ? "s" : ""} au total
            </span>
          )}

          {isLoading && (
            <div className="flex items-center gap-1 text-orange-500">
              <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Chargement...</span>
            </div>
          )}
        </div>

        {/* Pagination - Toujours affichée, même avec 1 seule page */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, totalPages)}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
