"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, Archive, PhoneCall, Plus, RotateCw, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

// ── Onglet "En cours" ──────────────────────────────────────────────────────────
import { OperationsDrawer } from "../../../../features/operations/components/OperationsDrawer";
import { OperationsKpiBar } from "../../../../features/operations/components/OperationsKpiBar";
import { OperationsSections } from "../../../../features/operations/components/OperationsSections";
import { PickupCodeInput } from "../../../../features/operations/components/PickupCodeInput";
import { PickupValidationModal } from "../../../../features/operations/components/PickupValidationModal";
import type { DrawerTabKey } from "../../../../features/operations/components/drawer/DrawerTabs";
import { useOperationsSocketSync } from "../../../../features/operations/hooks/useOperationsSocketSync";
import { useCourseByPickupCodeQuery } from "../../../../features/operations/queries/course-by-pickup-code.query";
import { useOperationsActiveQuery } from "../../../../features/operations/queries/operations-active.query";
import { groupOrdersForOperations } from "../../../../features/operations/utils/group-orders";
import { OrderType, type Order } from "../../../../features/orders/types/order.types";
import { useOrderDetailQuery } from "../../../../features/orders/queries/order-detail.query";

// ── Onglet "Commandes" ─────────────────────────────────────────────────────────
import AddOrderForm from "../../../../features/orders/components/add-order-form";
import ExportDropdown from "../../../../features/orders/components/ExportDropdown";
import { OrderFilters } from "../../../../features/orders/components/filtrage/OrderFilters";
import RestaurantTabs from "../../../../features/orders/components/filtrage/RestaurantTabs";
import { OrdersTable } from "../../../../features/orders/components/list-order";
import { CancelOrderModal } from "../../../../features/orders/components/modals/CancelOrderModal";
import { DeleteOrderModal } from "../../../../features/orders/components/modals/DeleteOrderModal";
import { useOrderListQuery } from "../../../../features/orders/queries/order-list.query";
import { refreshOrders } from "../../../../features/orders/services/order-service";
import { OrderStatus, OrderType as OT } from "../../../../features/orders/types/order.types";
import { OrderTable } from "../../../../features/orders/types/ordersTable.types";
import { UserType } from "../../../../features/users/types/user.types";
import { useMobileNavStore } from "@/store/mobileNavStore";

// ── Onglet "À relancer" ────────────────────────────────────────────────────────
import { CompteurRelances } from "../../../../features/orders/components/relances/CompteurRelances";
import BandeauRelances from "../../../../features/orders/components/relances/BandeauRelances";
import { OngletRelances } from "../../../../features/orders/components/relances/OngletRelances";
import { useRelancesQuery } from "../../../../features/orders/queries/relance.query";
import { demanderPermissionNotifications } from "../../../../features/orders/hooks/useSonRelances";
import { peutVoirLesBrouillons } from "../../../../features/orders/utils/brouillons";

// ─── Types ────────────────────────────────────────────────────────────────────

type CommandesTab = "temps_reel" | "historique" | "relances";

const TABS: { key: CommandesTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: "temps_reel", label: "En cours",   Icon: ({ className }) => <Activity className={className} /> },
  { key: "historique", label: "Commandes",  Icon: ({ className }) => <Archive className={className} /> },
  // Paniers de l'application non payés : ADMIN et centre d'appels seulement.
  { key: "relances",   label: "À relancer", Icon: ({ className }) => <PhoneCall className={className} /> },
];

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Page "Commandes" unifiée, trois onglets :
 *
 *  • **En cours**  : suivi temps réel (KPI + cards + code retrait livreur)
 *  • **Commandes** : table paginée avec filtres, création, modification
 *  • **À relancer** : paniers de l'application restés sans paiement (ADMIN,
 *    centre d'appels), avec leur compteur dans l'en-tête
 *
 * Header partagé en haut (titre, recherche, actualiser, créer, exporter).
 * Sélecteur d'onglets juste en dessous du header.
 * Drawer partagé pour la vue détail (remplace l'ancienne page de détail).
 */
export default function Operations() {
  useOperationsSocketSync();

  const [activeTab, setActiveTab] = useState<CommandesTab>("temps_reel");

  // ── Store ────────────────────────────────────────────────────────────────────
  const {
    selectedRestaurantId,
    orders,
    setFilter,
    setPagination,
    setSectionView,
    setSelectedItem,
    setRepriseTelephone,
    pendingOrdersView,
    clearPendingOrdersView,
  } = useDashboardStore();
  const { filters, pagination, modals, selectedItem: ordersSelectedItem, view: ordersView } =
    orders;
  const { user: currentUser, can } = useAuthStore();
  const queryClient = useQueryClient();

  // ── Relances (paniers non payés) ─────────────────────────────────────────────
  // Aucune lecture pour un autre rôle : la requête est désactivée à la source.
  const voitRelances = peutVoirLesBrouillons(currentUser);
  const { data: relances } = useRelancesQuery();
  const nbRelancesOnglet = useMemo(
    () =>
      (relances?.groupes ?? []).filter(
        (g) =>
          g.etat === "A_RELANCER" &&
          (!selectedRestaurantId || g.tete.restaurant?.id === selectedRestaurantId),
      ).length,
    [relances?.groupes, selectedRestaurantId],
  );
  const onglets = TABS.filter((t) => t.key !== "relances" || voitRelances);

  // Ouverture demandée d'ailleurs (bandeau, compteur, notification) : on
  // passe sur l'onglet puis on efface la demande, qui n'est jamais persistée.
  useEffect(() => {
    if (pendingOrdersView !== "relances") return;
    if (voitRelances) setActiveTab("relances");
    clearPendingOrdersView();
  }, [pendingOrdersView, voitRelances, clearPendingOrdersView]);

  // Droits relus en cours de route : l'onglet disparaît, on revient à « En cours ».
  useEffect(() => {
    if (activeTab === "relances" && !voitRelances) setActiveTab("temps_reel");
  }, [activeTab, voitRelances]);

  // ── Header partagé ───────────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Capture client : flux partagé (bouton in-page + bouton central de la barre d'onglets mobile)
  const openCapture = useMobileNavStore((s) => s.openCapture);

  // Le header passe en mode "retour" uniquement quand on crée/édite une commande
  const isEditing =
    activeTab === "historique" &&
    (ordersView === "create" || ordersView === "edit");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Commandes actualisées");
    } catch {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilter("orders", "search", query);
    setPagination("orders", 1, 10);
  };

  // ── Pickup code (onglet "En cours") ─────────────────────────────────────────
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const {
    data: course,
    isLoading: pickupLoading,
    isError: pickupIsError,
    refetch: pickupRefetch,
  } = useCourseByPickupCodeQuery(submittedCode ?? "", submittedCode !== null);

  // ── Données "En cours" ───────────────────────────────────────────────────────
  const { data, isLoading } = useOperationsActiveQuery(selectedRestaurantId ?? undefined);

  const buckets = useMemo(() => groupOrdersForOperations(data ?? []), [data]);
  const inDeliveryCount = useMemo(
    () => buckets.recuperees.filter((o) => o.type === OrderType.DELIVERY).length,
    [buckets.recuperees],
  );

  // ── Drawer partagé ───────────────────────────────────────────────────────────
  // selectedOrder            : commande venant des cards "En cours" (objet complet)
  // selectedHistoriqueOrderId : ID depuis le tableau → fetch puis drawer s'ouvre
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedHistoriqueOrderId, setSelectedHistoriqueOrderId] = useState<string | null>(null);
  const [initialDrawerTab, setInitialDrawerTab] = useState<DrawerTabKey>("details");

  const { data: fetchedHistoriqueOrder } = useOrderDetailQuery(
    selectedHistoriqueOrderId ?? "",
  );

  const drawerOrder: Order | null =
    selectedOrder ??
    (selectedHistoriqueOrderId ? (fetchedHistoriqueOrder as Order | null) ?? null : null);

  const handleCardClick = (order: Order) => {
    setInitialDrawerTab("details");
    setSelectedHistoriqueOrderId(null);
    setSelectedOrder(order);
  };
  const handlePayClick = (order: Order) => {
    setInitialDrawerTab("payment");
    setSelectedHistoriqueOrderId(null);
    setSelectedOrder(order);
  };
  const handleTableRowClick = (order: OrderTable) => {
    setInitialDrawerTab("details");
    setSelectedOrder(null);
    setSelectedHistoriqueOrderId(order.id);
  };
  const handleCloseDrawer = () => {
    setSelectedOrder(null);
    setSelectedHistoriqueOrderId(null);
  };

  // « Ouvrir » d'une relance : même tiroir qu'un clic dans le tableau.
  const handleOuvrirRelance = (orderId: string) => {
    setInitialDrawerTab("details");
    setSelectedOrder(null);
    setSelectedHistoriqueOrderId(orderId);
  };

  /**
   * « Reprendre au téléphone » : « Modifier la commande » n'existe que sur
   * l'onglet « Commandes ». Le formulaire s'ouvre sur l'origine « Call
   * center » : c'est la bascule, à l'enregistrement, qui transmet la commande
   * au restaurant et la sort des relances.
   */
  const reprendreAuTelephone = (commande: OrderTable) => {
    handleCloseDrawer();
    setActiveTab("historique");
    setRepriseTelephone(commande.id);
    setSelectedItem("orders", commande);
    setSectionView("orders", "edit");
  };

  // ── Données "Commandes" ──────────────────────────────────────────────────────
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useOrderListQuery({
    restaurantId: selectedRestaurantId,
    page: pagination.page,
    reference: filters?.search as string,
    startDate: filters?.startDate
      ? typeof filters.startDate === "string"
        ? filters.startDate
        : (filters.startDate as Date).toISOString()
      : undefined,
    endDate: filters?.endDate
      ? typeof filters.endDate === "string"
        ? filters.endDate
        : (filters.endDate as Date).toISOString()
      : undefined,
    type:   filters?.type   ? (filters.type   as OT)          : undefined,
    status: filters?.status ? (filters.status  as OrderStatus) : undefined,
    auto:   filters?.source ? filters.source === "auto"        : undefined,
  });

  return (
    <div className="flex-1">
      {/* ── Header partagé ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        {isEditing ? (
          /* Mode création / modification : header avec bouton retour */
          <DashboardPageHeader
            mode={ordersView}
            onBack={() => setSectionView("orders", "list")}
            title={ordersView === "create" ? "Créer une commande" : "Modifier la commande"}
            gradient={true}
            actions={
              can(Modules.COMMANDES, Action.EXPORT)
                ? [
                    {
                      label: "Exporter",
                      onClick: () => {},
                      customComponent: <ExportDropdown buttonText="Exporter" />,
                    },
                  ]
                : []
            }
          />
        ) : (
          /* Mode liste : header complet avec recherche + actions */
          <DashboardPageHeader
            mode="list"
            title="Commandes"
            searchConfig={{
              placeholder: "Rechercher par référence...",
              value: filters?.search as string,
              onSearch: handleSearch,
              realTimeSearch: true,
            }}
            actions={[
              ...(voitRelances
                ? [
                    {
                      label: "À relancer",
                      onClick: () => setActiveTab("relances"),
                      customComponent: <CompteurRelances />,
                    },
                  ]
                : []),
              ...(can(Modules.BASE_DONNEES, Action.CREATE)
                ? [
                    {
                      label: "Capturer un client Glovo/Yango",
                      shortLabel: "Glovo/Yango",
                      onClick: openCapture,
                      variant: "secondary" as const,
                      icon: UserPlus,
                      className:
                        "bg-[#F17922] border border-[#F17922] text-white hover:opacity-90",
                    },
                  ]
                : []),
              ...(can(Modules.COMMANDES, Action.READ)
                ? [
                    {
                      label: isRefreshing ? "Actualisation..." : "Actualiser",
                      onClick: handleRefresh,
                      variant: "secondary" as const,
                      icon: RotateCw,
                      iconOnlyWhenCompact: true,
                      className:
                        "bg-white border border-gray-300 text-[#595959] hover:bg-gray-50",
                    },
                  ]
                : []),
              ...(can(Modules.COMMANDES, Action.CREATE)
                ? [
                    {
                      label: "Créer une commande",
                      shortLabel: "Commande",
                      onClick: () => {
                        setActiveTab("historique");
                        setSectionView("orders", "create");
                      },
                      variant: "secondary" as const,
                      icon: Plus,
                      className:
                        "bg-white border border-[#F17922] text-[#F17922] hover:bg-white hover:opacity-80",
                    },
                  ]
                : []),
              ...(can(Modules.COMMANDES, Action.EXPORT)
                ? [
                    {
                      label: "Exporter",
                      onClick: () => {},
                      customComponent: <ExportDropdown buttonText="Exporter" />,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </div>

      {/* ── Paniers à relancer : sur cette page seulement, sous l'en-tête ────── */}
      {!isEditing && (
        <div className="px-4">
          <BandeauRelances />
        </div>
      )}

      {/* ── Sélecteur d'onglets — segmented control plein-largeur sur mobile ──── */}
      {!isEditing && (
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center bg-[#f4f4f5] rounded-[14px] p-1 gap-1 w-full sm:w-fit">
            {onglets.map((tab) => {
              const isActive = activeTab === tab.key;
              const pastille = tab.key === "relances" ? nbRelancesOnglet : 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    // Geste de l'agent : la permission des notifications des relances se demande ici.
                    if (tab.key === "relances") demanderPermissionNotifications();
                    setActiveTab(tab.key);
                  }}
                  className={`flex-1 sm:flex-none transition-all font-bold cursor-pointer text-[13px] ${onglets.length > 2 ? "px-2" : "px-5"} sm:px-5 rounded-[11px] focus:outline-none whitespace-nowrap inline-flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[30px]
                    ${isActive ? "bg-[#F17922] text-white shadow-sm" : "bg-transparent text-[#71717A] font-normal active:bg-black/5"}
                  `}
                >
                  <tab.Icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${onglets.length > 2 ? "hidden min-[400px]:block" : ""}`} />
                  {tab.label}
                  {pastille > 0 && (
                    <span
                      className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none inline-flex items-center justify-center ${
                        isActive ? "bg-white text-[#F17922]" : "bg-[#F17922] text-white"
                      }`}
                    >
                      {pastille > 99 ? "99+" : pastille}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Onglet : En cours ────────────────────────────────────────────────── */}
      {activeTab === "temps_reel" && (
        <div className="p-4 space-y-4">
          {/* Filtre restaurant — mêmes privilèges de visibilité que la tab Commandes :
              visible uniquement pour les utilisateurs BACKOFFICE (admin / marketing).
              Pour un manager restaurant, le composant ne se rend pas et le filtre
              reste pilote par le backend via le JWT. */}
          <RestaurantTabs showAllTab={currentUser?.type === UserType.BACKOFFICE} />

          {/* Code retrait livreur */}
          <div className="max-w-md">
            <PickupCodeInput onSubmit={setSubmittedCode} isLoading={pickupLoading} />
            {pickupIsError && submittedCode && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Aucune course trouvée pour le code{" "}
                  <strong>{submittedCode}</strong>.
                </span>
                <button
                  onClick={() => {
                    setSubmittedCode(null);
                    pickupRefetch();
                  }}
                  className="ml-auto text-[#F17922] underline"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>

          {course && submittedCode && (
            <PickupValidationModal
              course={course}
              onClose={() => setSubmittedCode(null)}
            />
          )}

          {/* KPIs masqués sur mobile : les compteurs sont repris dans les onglets d'état */}
          <div className="hidden md:block">
            <OperationsKpiBar buckets={buckets} inDeliveryCount={inDeliveryCount} />
          </div>

          {isLoading && !data ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
            </div>
          ) : (
            <OperationsSections
              buckets={buckets}
              onCardClick={handleCardClick}
              onPayClick={handlePayClick}
            />
          )}
        </div>
      )}

      {/* ── Onglet : Commandes ───────────────────────────────────────────────── */}
      {activeTab === "historique" && (
        <div className="p-4">
          {/* Liste */}
          {ordersView === "list" && (
            <>
              <RestaurantTabs showAllTab={currentUser?.type === UserType.BACKOFFICE} />
              <OrderFilters />
              <OrdersTable
                currentUser={currentUser}
                orders={ordersData}
                isLoading={ordersLoading}
                error={ordersError}
                onRowClick={handleTableRowClick}
                onViewDetails={handleTableRowClick}
              />

              {/* Modales depuis le menu contextuel */}
              {modals?.to_delete && ordersSelectedItem && (
                <DeleteOrderModal isOpen={true} order={ordersSelectedItem} />
              )}
              {modals?.to_cancel && ordersSelectedItem && (
                <CancelOrderModal isOpen={true} order={ordersSelectedItem} />
              )}
            </>
          )}

          {/* Création */}
          {ordersView === "create" && <AddOrderForm />}

          {/* Modification */}
          {ordersView === "edit" && ordersSelectedItem && (
            <AddOrderForm editOrder={ordersSelectedItem} />
          )}
        </div>
      )}

      {/* ── Onglet : À relancer ──────────────────────────────────────────────── */}
      {activeTab === "relances" && voitRelances && (
        <div className="p-4 space-y-4">
          <RestaurantTabs showAllTab={currentUser?.type === UserType.BACKOFFICE} />
          <OngletRelances onOuvrir={handleOuvrirRelance} onReprendre={reprendreAuTelephone} />
        </div>
      )}

      {/* ── Drawer partagé (En cours + Commandes + À relancer) ──────────────── */}
      <OperationsDrawer
        order={drawerOrder}
        initialTab={initialDrawerTab}
        onClose={handleCloseDrawer}
      />

    </div>
  );
}
