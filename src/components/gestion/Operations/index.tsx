"use client";

import React, { useMemo, useState } from "react";
import { Activity, AlertCircle, Archive } from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type CommandesTab = "temps_reel" | "historique";

const TABS: { key: CommandesTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: "temps_reel", label: "En cours",   Icon: ({ className }) => <Activity className={className} /> },
  { key: "historique", label: "Commandes",  Icon: ({ className }) => <Archive className={className} /> },
];

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Page "Commandes" unifiée — deux onglets :
 *
 *  • **En cours**  : suivi temps réel (KPI + cards + code retrait livreur)
 *  • **Commandes** : table paginée avec filtres, création, modification
 *
 * Header partagé en haut (titre, recherche, actualiser, créer, exporter).
 * Sélecteur d'onglets juste en dessous du header.
 * Drawer partagé pour la vue détail (remplace l'ancienne page de détail).
 */
export default function Operations() {
  useOperationsSocketSync();

  const [activeTab, setActiveTab] = useState<CommandesTab>("temps_reel");

  // ── Store ────────────────────────────────────────────────────────────────────
  const { selectedRestaurantId, orders, setFilter, setPagination, setSectionView } =
    useDashboardStore();
  const { filters, pagination, modals, selectedItem: ordersSelectedItem, view: ordersView } =
    orders;
  const { user: currentUser, can } = useAuthStore();
  const queryClient = useQueryClient();

  // ── Header partagé ───────────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);

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
              ...(can(Modules.COMMANDES, Action.READ)
                ? [
                    {
                      label: isRefreshing ? "Actualisation..." : "Actualiser",
                      onClick: handleRefresh,
                      variant: "secondary" as const,
                      className:
                        "bg-white border border-gray-300 text-[#595959] hover:bg-gray-50",
                    },
                  ]
                : []),
              ...(can(Modules.COMMANDES, Action.CREATE)
                ? [
                    {
                      label: "Créer une commande",
                      onClick: () => {
                        setActiveTab("historique");
                        setSectionView("orders", "create");
                      },
                      variant: "secondary" as const,
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

      {/* ── Sélecteur d'onglets (sous le header, masqué en create/edit) ──────── */}
      {!isEditing && (
        <div className="px-4 pt-3 pb-0">
          <div
            className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit"
            style={{ minHeight: 40 }}
          >
            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`transition-colors font-bold cursor-pointer text-[13px] px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap inline-flex items-center gap-1.5
                    ${isActive ? "bg-[#F17922] text-white shadow-none" : "bg-transparent text-[#71717A] font-normal"}
                    ${idx === 0 ? "" : "ml-1"}
                  `}
                  style={{ height: 30 }}
                >
                  <tab.Icon className="w-3.5 h-3.5" />
                  {tab.label}
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

          <OperationsKpiBar buckets={buckets} inDeliveryCount={inDeliveryCount} />

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

      {/* ── Drawer partagé (En cours + Commandes) ───────────────────────────── */}
      <OperationsDrawer
        order={drawerOrder}
        initialTab={initialDrawerTab}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
