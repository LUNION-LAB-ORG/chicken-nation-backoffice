"use client";

import Modal from "@/components/ui/Modal";
import { useRBAC } from "@/hooks/useRBAC";
import { getRestaurantById } from "@/services/restaurantService";
import { useOrderStore } from "@/store/orderStore";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Order } from "../../types/ordersTable.types";
import { getWorkflowConfig } from "../../utils/workflowConfig";
import CustomerInfoSection from "./CustomerInfoSection";
import DeliveryProgressSection from "./DeliveryProgressSection";
import OrderInfoSection from "./OrderInfoSection";
import OrderItemsSection from "./OrderItemsSection";
import PriceSummarySection from "./PriceSummarySection";
import WorkflowActions from "./WorkflowActions";

export interface OrderDetailsProps {
  order: Order;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  onReject,
  onStatusChange,
}) => {
  const { getOrderById, fetchOrderById, updateOrderStatus, handlePrintOrder } =
    useOrderStore();
  const { canAcceptCommande, canRejectCommande, canUpdateCommande } = useRBAC();

  const [fullOrderDetails, setFullOrderDetails] = useState<{
    id: string;
    status: string;
    restaurant_id?: string;
    type?: string;
    time?: string;
    date?: string;
    [key: string]: unknown;
  } | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>(
    order.restaurant || "Restaurant inconnu"
  );
  const [currentStatus, setCurrentStatus] = useState<string>(order.status);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Fonction pour traduire le statut API en statut UI
  const convertApiStatusToUiStatus = useCallback(
    (apiStatus: string): Order["status"] => {
      if (fullOrderDetails?.type === "PICKUP") {
        const pickupStatusMapping: Record<string, Order["status"]> = {
          PENDING: "NOUVELLE",
          ACCEPTED: "EN COURS",
          IN_PROGRESS: "EN PRÉPARATION",
          PREPARATION: "EN PRÉPARATION",
          READY: "PRÊT",
          COLLECTED: "COLLECTÉ",
          CANCELLED: "ANNULÉE",
        };
        return pickupStatusMapping[apiStatus] || "NOUVELLE";
      }

      const statusMapping: Record<string, Order["status"]> = {
        PENDING: "NOUVELLE",
        ACCEPTED: "EN COURS",
        IN_PROGRESS: "EN PRÉPARATION",
        PREPARATION: "EN PRÉPARATION",
        READY: "PRÊT",
        PICKED_UP: "LIVRAISON",
        DELIVERED: "LIVRÉ",
        COLLECTED: "COLLECTÉ",
        CANCELLED: "ANNULÉE",
        COMPLETED: "TERMINÉ",
      };

      return statusMapping[apiStatus] || "NOUVELLE";
    },
    [fullOrderDetails?.type]
  );

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!order.id) {
        return;
      }

      try {
        if (fetchOrderById) {
          const response = await fetchOrderById(order.id);

          if (response) {
            setFullOrderDetails(response);

            if (response.status) {
              const newStatus = convertApiStatusToUiStatus(response.status);
              setCurrentStatus(newStatus);
            }

            if (
              response.restaurant &&
              typeof response.restaurant === "object" &&
              response.restaurant.name
            ) {
              setRestaurantName(response.restaurant.name);
            } else if (response.restaurant_id) {
              try {
                const restaurantData = await getRestaurantById(
                  String(response.restaurant_id)
                );
                if (restaurantData && restaurantData.name) {
                  setRestaurantName(restaurantData.name);
                } else {
                  setRestaurantName(String(response.restaurant_id || ""));
                }
              } catch (_error) {
                setRestaurantName(String(response.restaurant_id || ""));
              }
            }
          }
        } else if (getOrderById) {
          const response = getOrderById(order.id);

          if (response) {
            setFullOrderDetails(response);

            if (response.status) {
              setCurrentStatus(convertApiStatusToUiStatus(response.status));
            }

            if (
              response.restaurant &&
              typeof response.restaurant === "object" &&
              response.restaurant.name
            ) {
              setRestaurantName(response.restaurant.name);
            } else if (response.restaurant_id) {
              setRestaurantName(String(response.restaurant_id || ""));
            }
          }
        }
      } catch (error) {
        console.error(
          "[OrderDetails] Erreur lors de la récupération des détails:",
          error
        );
        toast.error(
          "Erreur lors de la récupération des détails de la commande"
        );
      }
    };

    fetchOrderDetails();
  }, [order.id, getOrderById, fetchOrderById, convertApiStatusToUiStatus]);

  const handleWorkflowAction = async () => {
    const workflowConfig = getWorkflowConfig(orderType, currentStatus);

    if (!workflowConfig.nextStatus) {
      return;
    }

    const newStatus = workflowConfig.nextStatus;

    if (currentStatus === "PRÊT" && workflowConfig.buttonText === "Terminer") {
      setShowConfirmModal(true);
      return;
    }

    await executeWorkflowAction(newStatus);
  };

  const executeWorkflowAction = async (newStatus: string) => {
    const workflowConfig = getWorkflowConfig(orderType, currentStatus);
    setCurrentStatus(newStatus);

    try {
      if (orderType === "À table") {
        if (newStatus === "EN COURS") {
          await updateOrderStatus(order.id, "ACCEPTED");
        } else if (newStatus === "PRÊT") {
          await updateOrderStatus(order.id, "IN_PROGRESS");
          await updateOrderStatus(order.id, "READY");
        } else if (newStatus === "TERMINÉ") {
          await updateOrderStatus(order.id, "COMPLETED");
        }
      } else {
        if (newStatus === "EN COURS") {
          await updateOrderStatus(order.id, "ACCEPTED");
        } else if (newStatus === "EN PRÉPARATION") {
          await updateOrderStatus(order.id, "IN_PROGRESS");
        } else if (newStatus === "PRÊT") {
          await updateOrderStatus(order.id, "READY");
        } else if (newStatus === "COLLECTÉ") {
          if (orderType === "À récupérer") {
            await updateOrderStatus(order.id, "COLLECTED");
            await updateOrderStatus(order.id, "COMPLETED");
          } else {
            await updateOrderStatus(order.id, "PICKED_UP");
            await updateOrderStatus(order.id, "DELIVERED");
            await updateOrderStatus(order.id, "COLLECTED");
            await updateOrderStatus(order.id, "COMPLETED");
          }
        }
      }

      toast.success(`${workflowConfig.buttonText} effectué avec succès`, {
        duration: 3000,
        position: "top-center",
      });

      if (onStatusChange) {
        onStatusChange(order.id, newStatus);
      }
    } catch (error: unknown) {
      setCurrentStatus(currentStatus);

      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Erreur lors de l'action: ${errorMessage}`, {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  const handleConfirmFinish = async () => {
    setShowConfirmModal(false);
    const workflowConfig = getWorkflowConfig(orderType, currentStatus);
    if (workflowConfig.nextStatus) {
      await executeWorkflowAction(workflowConfig.nextStatus);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };

  const orderType = order.orderType || "À livrer";

  const paymentMethod =
    order?.paiements && order.paiements.length > 0
      ? `${order.paiements[0].mode} : ${order.paiements[0].source || ""}`
      : "Non renseigné";

  const customerName =
    order.clientName ||
    (fullOrderDetails?.customer &&
    typeof fullOrderDetails.customer === "object" &&
    "first_name" in fullOrderDetails.customer &&
    "last_name" in fullOrderDetails.customer
      ? `${String(fullOrderDetails.customer.first_name || "")} ${String(
          fullOrderDetails.customer.last_name || ""
        )}`.trim()
      : typeof fullOrderDetails?.fullname === "string"
      ? fullOrderDetails.fullname
      : "Client inconnu");

  const customerEmail =
    order.clientEmail ||
    (fullOrderDetails?.customer &&
    typeof fullOrderDetails.customer === "object" &&
    "email" in fullOrderDetails.customer
      ? String(fullOrderDetails.customer.email || "")
      : typeof fullOrderDetails?.email === "string"
      ? fullOrderDetails.email
      : "");

  const customerPhone =
    order.clientPhone ||
    (fullOrderDetails?.customer &&
    typeof fullOrderDetails.customer === "object" &&
    "phone" in fullOrderDetails.customer
      ? String(fullOrderDetails.customer.phone || "")
      : typeof fullOrderDetails?.phone === "string"
      ? fullOrderDetails.phone
      : "");

  const customerAddress =
    order.address ||
    (fullOrderDetails?.address
      ? typeof fullOrderDetails.address === "string"
        ? fullOrderDetails.address
        : typeof fullOrderDetails.address === "object"
        ? JSON.stringify(fullOrderDetails.address)
        : "Adresse non spécifiée"
      : "Adresse non spécifiée");

  const orderReference = order.reference || "Référence non disponible";
  const orderItems = order.items || [];

  let totalPrice = order.totalPrice || 0;

  if (totalPrice === 0 && fullOrderDetails) {
    if (
      typeof fullOrderDetails.amount === "number" &&
      fullOrderDetails.amount > 0
    ) {
      totalPrice = fullOrderDetails.amount;
    } else if (
      typeof fullOrderDetails.total === "number" &&
      fullOrderDetails.total > 0
    ) {
      totalPrice = fullOrderDetails.total;
    } else if (
      typeof fullOrderDetails.price === "number" &&
      fullOrderDetails.price > 0
    ) {
      totalPrice = fullOrderDetails.price;
    }

    if (
      totalPrice === 0 &&
      Array.isArray(fullOrderDetails.order_items) &&
      fullOrderDetails.order_items.length > 0
    ) {
      totalPrice = fullOrderDetails.order_items.reduce((sum, item) => {
        let itemPrice = 0;
        if (typeof item.price === "number") {
          itemPrice = item.price;
        } else if (typeof item.amount === "number") {
          itemPrice = item.amount;
        } else if (item.dish && typeof item.dish.price === "number") {
          itemPrice = item.dish.price;
        }

        const quantity = typeof item.quantity === "number" ? item.quantity : 1;
        return sum + itemPrice * quantity;
      }, 0);
    }
  }

  const tax =
    order.tax ||
    (fullOrderDetails && typeof fullOrderDetails.tax === "number"
      ? fullOrderDetails.tax
      : 0);

  const subtotal =
    order.subtotal ||
    (fullOrderDetails && typeof fullOrderDetails.subtotal === "number"
      ? fullOrderDetails.subtotal
      : totalPrice - tax);

  const discount =
    order.discount ||
    (fullOrderDetails && typeof fullOrderDetails.discount === "number"
      ? fullOrderDetails.discount
      : 0);

  const workflowConfig = getWorkflowConfig(orderType, currentStatus);

  return (
    <div className="bg-white rounded-xl min-h-screen shadow-sm">
      <div className="">
        <div className="flex flex-col md:flex-row gap-4 md:gap-12">
          {/* Partie gauche */}
          <div className="md:w-3/5 p-4 sm:p-6 h-auto">
            <OrderInfoSection
              order={order}
              restaurantName={restaurantName}
              orderType={orderType}
              orderReference={orderReference}
              paymentMethod={paymentMethod}
              currentStatus={currentStatus}
            />

            <OrderItemsSection
              orderItems={orderItems}
              totalPrice={totalPrice}
            />
          </div>

          {/* Partie droite */}
          <div className="md:w-3/6 p-4 sm:p-6 pb-20 md:pb-6 bg-[#FBFBFB] h-auto overflow-y-auto md:overflow-visible">
            <CustomerInfoSection
              customerName={customerName}
              customerAddress={customerAddress}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
            />

            <DeliveryProgressSection
              orderType={fullOrderDetails?.type}
              currentStatus={currentStatus}
              deliveryService={
                fullOrderDetails?.delivery_service as string | undefined
              }
            />

            <PriceSummarySection
              subtotal={subtotal}
              tax={tax}
              deliveryPrice={order.deliveryPrice}
              discount={discount}
              totalPrice={totalPrice}
            />

            <WorkflowActions
              currentStatus={currentStatus}
              workflowConfig={workflowConfig}
              canAcceptCommande={canAcceptCommande()}
              canRejectCommande={canRejectCommande()}
              canUpdateCommande={canUpdateCommande()}
              onWorkflowAction={handleWorkflowAction}
              onReject={() => {
                if (onReject) {
                  onReject(order.id);
                }
              }}
              onPrint={async () => {
                const result = await handlePrintOrder(order.id);
                console.log(result);
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelConfirm}
        title="Terminer la commande"
      >
        <div className="text-center text-[#484848] text-[16px] mb-6">
          Êtes-vous sûr de vouloir terminer cette commande ?<br />
          Cette action marquera la commande comme terminée et ne pourra pas être
          annulée.
        </div>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px]"
            onClick={handleCancelConfirm}
          >
            Annuler
          </button>
          <button
            type="button"
            className="bg-[#F17922] text-white cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px]"
            onClick={handleConfirmFinish}
          >
            Confirmer
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetails;
