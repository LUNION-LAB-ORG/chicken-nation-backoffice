"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Order } from "./OrdersTable";
import Image from "next/image";
import { useOrderStore } from "@/store/orderStore";
import { getRestaurantById } from "@/services/restaurantService";
import { useRBAC } from "@/hooks/useRBAC";
import toast from "react-hot-toast";
import PaymentBadge, { PaymentStatus } from "./PaymentBadge";
import Modal from "@/components/ui/Modal";
import { format } from "date-fns";
import { Order as IOrder } from "../../../../features/orders/types/order.types";

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
  if (order.paied == false) {
    return "UNPAID";
  }
  // Pour toutes les autres commandes, elles sont considérées comme payées
  return "PAID";
};

//  Image sécurisé pour éviter les erreurs d'URL invalide
interface SafeImageProps {
  src: string | undefined | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  onError,
}) => {
  // Validation et nettoyage de l'URL
  const getSafeImageSrc = (imageUrl: string | undefined | null): string => {
    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
      return "/images/food2.png";
    }

    const cleanUrl = imageUrl.trim();

    // Vérifier si c'est une URL valide
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

  const safeSrc = getSafeImageSrc(src);

  return (
    <Image
      src={safeSrc}
      alt={alt || "Image"}
      width={width}
      height={height}
      className={className}
      onError={(e) => {
        console.warn("Erreur de chargement d'image:");
        (e.target as HTMLImageElement).src = "/images/food2.png";
        if (onError) onError(e);
      }}
    />
  );
};

function getAuthToken() {
  try {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "chicken-nation-token") {
        return decodeURIComponent(value);
      }
    }

    console.error("Token non trouvé dans les cookies");
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du token:", error);
    return null;
  }
}

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  onBack,
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
  const [orderData, setOrderData] = useState<IOrder | null>(null); // Variable non utilisée
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
    async function getOrder() {
      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_PREFIX + `/orders/${order.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      setOrderData(data); // Fonction non utilisée

      return data;
    }
    getOrder();
  }, [order]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!order.id) {
        return;
      }

      try {
        // Toujours utiliser fetchOrderById pour obtenir les données complètes de l'API
        if (fetchOrderById) {
          const response = await fetchOrderById(order.id);

          if (response) {
            // Mettre à jour les détails complets
            setFullOrderDetails(response);

            // Mettre à jour le statut si disponible
            if (response.status) {
              const newStatus = convertApiStatusToUiStatus(response.status);

              setCurrentStatus(newStatus);
            }

            // Extraire et mettre à jour les informations du restaurant
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
          } else {
            console.warn(
              "[OrderDetails] Aucune donnée retournée par l'API pour l'ID:"
            );
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
        } else {
          console.error(
            "[OrderDetails] Aucune fonction de récupération disponible"
          );
          return;
        }
      } catch (error) {
        console.error(
          "[OrderDetails] Erreur lors de la récupération des détails de la commande:",
          error
        );
        toast.error(
          "Erreur lors de la récupération des détails de la commande"
        );
      }
    };

    fetchOrderDetails();
  }, [order.id, getOrderById, fetchOrderById, convertApiStatusToUiStatus]);

  const getWorkflowConfig = (orderType: string, currentStatus: string) => {
    {
      // Workflow pour commandes DELIVERY et PICKUP
      switch (currentStatus) {
        case "NOUVELLE":
          return {
            badgeText: "Nouvelle commande",
            buttonText: "Accepter",
            nextStatus: "EN COURS",
            nextBadgeText: "En cours",
          };
        case "EN COURS":
          return {
            badgeText: "En cours",
            buttonText: "En préparation",
            nextStatus: "EN PRÉPARATION",
            nextBadgeText: "En préparation",
          };
        case "EN PRÉPARATION":
          return {
            badgeText: "En préparation",
            buttonText: "Prêt",
            nextStatus: "PRÊT",
            nextBadgeText: "Prêt",
          };
        case "PRÊT":
          return {
            badgeText: "Prêt",
            buttonText: "Terminer",
            nextStatus: "COLLECTÉ", // Passer à COLLECTÉ pour toutes les commandes
            nextBadgeText: "Terminé",
          };
        case "COLLECTÉ":
        case "LIVRAISON":
        case "LIVRÉ":
        case "TERMINÉ":
          return {
            badgeText: "Terminé",
            buttonText: null,
            nextStatus: null,
            nextBadgeText: null,
          };
        default:
          return {
            badgeText: currentStatus,
            buttonText: null,
            nextStatus: null,
            nextBadgeText: null,
          };
      }
    }
  };

  // Nouvelle fonction pour gérer le workflow avec bouton unique
  const handleWorkflowAction = async () => {
    const workflowConfig = getWorkflowConfig(orderType, currentStatus);

    if (!workflowConfig.nextStatus) {
      return;
    }

    const newStatus = workflowConfig.nextStatus;

    // Si c'est le bouton "Terminer" (statut PRÊT -> COLLECTÉ), demander confirmation
    if (currentStatus === "PRÊT" && workflowConfig.buttonText === "Terminer") {
      setShowConfirmModal(true);
      return;
    }

    await executeWorkflowAction(newStatus);
  };

  // Fonction séparée pour exécuter l'action du workflow
  const executeWorkflowAction = async (newStatus: string) => {
    const workflowConfig = getWorkflowConfig(orderType, currentStatus);
    setCurrentStatus(newStatus);

    try {
      if (orderType === "À table") {
        // Workflow TABLE
        if (newStatus === "EN COURS") {
          // Accepter la réservation
          await updateOrderStatus(order.id, "ACCEPTED");
        } else if (newStatus === "PRÊT") {
          // Passer par les étapes intermédiaires jusqu'à READY
          await updateOrderStatus(order.id, "IN_PROGRESS");
          await updateOrderStatus(order.id, "READY");
        } else if (newStatus === "TERMINÉ") {
          // ✅ Pour TABLE: Aller directement à COMPLETED
          await updateOrderStatus(order.id, "COMPLETED");
        }
      } else {
        // Workflow DELIVERY et PICKUP
        if (newStatus === "EN COURS") {
          // Accepter la commande
          await updateOrderStatus(order.id, "ACCEPTED");
        } else if (newStatus === "EN PRÉPARATION") {
          // Commencer la préparation
          await updateOrderStatus(order.id, "IN_PROGRESS");
        } else if (newStatus === "PRÊT") {
          // Marquer comme prêt
          await updateOrderStatus(order.id, "READY");
        } else if (newStatus === "COLLECTÉ") {
          // Pour DELIVERY/PICKUP: Valider toutes les étapes jusqu'à COLLECTED puis COMPLETED
          if (orderType === "À récupérer") {
            await updateOrderStatus(order.id, "COLLECTED");
            await updateOrderStatus(order.id, "COMPLETED"); // ✅ Étape finale
          } else {
            await updateOrderStatus(order.id, "PICKED_UP");
            await updateOrderStatus(order.id, "DELIVERED");
            await updateOrderStatus(order.id, "COLLECTED");
            await updateOrderStatus(order.id, "COMPLETED"); // ✅ Étape finale
          }
        }
      }

      toast.success(`${workflowConfig.buttonText} effectué avec succès`, {
        duration: 3000,
        position: "top-center",
      });

      // ✅ Déclencher le refresh des données dans le composant parent
      if (onStatusChange) {
        onStatusChange(order.id, newStatus);
      }
    } catch (error: unknown) {
      // Rétablir le statut précédent en cas d'erreur
      setCurrentStatus(currentStatus);

      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Erreur lors de l'action: ${errorMessage}`, {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  // Fonction pour confirmer la fin de la commande
  const handleConfirmFinish = async () => {
    setShowConfirmModal(false);
    const workflowConfig = getWorkflowConfig(orderType, currentStatus);
    if (workflowConfig.nextStatus) {
      await executeWorkflowAction(workflowConfig.nextStatus);
    }
  };

  // Fonction pour annuler la confirmation
  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };

  // Fonction pour obtenir le titre de la section en fonction du statut
  const getDeliverySectionTitle = () => {
    if (fullOrderDetails?.type === "PICKUP") {
      switch (currentStatus) {
        case "PRÊT":
          return "Prêt à récupérer";
        case "RÉCUPÉRÉ":
          return "Récupéré";
        case "EN COURS":
          return "En cours de préparation";
        case "EN PRÉPARATION":
          return "En préparation";
        case "ANNULÉE":
          return "Annulée";
        default:
          return "Suivi de la commande";
      }
    }

    switch (currentStatus) {
      case "LIVRAISON":
        return "En livraison";
      case "LIVRÉ":
        return "Livré";
      case "RÉCUPÉRÉ":
        return "Récupéré";
      case "PRÊT":
        return "Prêt à emporter";
      case "EN COURS":
        return "En cours de préparation";
      case "EN PRÉPARATION":
        return "En préparation";
      case "ANNULÉE":
        return "Annulée";
      default:
        return "Suivi de la commande";
    }
  };

  // Utiliser le type de commande depuis les données étendues
  const orderType = order.orderType || "À livrer";

  // Utiliser les données étendues de l'objet order avec vérification supplémentaire
  const paymentMethod =
    order?.paiements && order.paiements.length > 0
      ? `${order.paiements[0].mode} : ${order.paiements[0].source || ""}`
      : "Non renseigné";

  // Informations client avec vérification de disponibilité
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

  // Utiliser les données étendues pour les dates
  const orderDate = order.date || "Date inconnue";
  const orderReference = order.reference || "Référence non disponible";

  // Utiliser les données étendues pour les items avec calcul de secours
  const orderItems = order.items || [];

  // Calcul du prix total avec vérification des sources alternatives
  let totalPrice = order.totalPrice || 0;

  // Si le prix total n'est pas disponible dans l'objet order, essayer de le calculer à partir des données complètes
  if (totalPrice === 0 && fullOrderDetails) {
    // Essayer d'abord les champs directs
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

    // Si toujours pas de prix, essayer de calculer à partir des items
    if (
      totalPrice === 0 &&
      Array.isArray(fullOrderDetails.order_items) &&
      fullOrderDetails.order_items.length > 0
    ) {
      totalPrice = fullOrderDetails.order_items.reduce((sum, item) => {
        // Vérifier toutes les sources possibles de prix
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

  // Autres informations de coût
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
  console.log({ orderData, order });
  const getProgressStyles = () => {
    const styles = {
      // Étape 1 - Restaurant
      step1Border: "border-[#F17922]",
      step1Bg: "bg-white",
      step1Icon: "/icons/poulet.png",

      // Ligne entre étape 1 et 2
      line1: "bg-[#FFE8D7]",

      // Étape 2 - Préparation
      step2Border: "border-[#F17922]",
      step2Bg: "bg-white",
      step2Icon: "/icons/package_orange.png",

      // Ligne entre étape 2 et 3
      line2: "bg-[#FFE8D7]",

      // Étape 3 - Livraison
      step3Border: "border-[#F17922]",
      step3Bg: "bg-white",
      step3Icon: "/icons/location-outline.png",
    };

    // Pour les commandes TABLE, si le statut est PRÊT, tout est complété
    if (fullOrderDetails?.type === "TABLE" && currentStatus === "PRÊT") {
      styles.step1Bg = "bg-[#F17922]";
      styles.step1Icon = "/icons/poulet-blanc.png";
      styles.line1 = "bg-[#F17922]";
      styles.step2Bg = "bg-[#F17922]";
      styles.step2Icon = "/icons/package.png";
      styles.line2 = "bg-[#F17922]";
      styles.step3Bg = "bg-[#F17922]";
      styles.step3Icon = "/icons/location_white.png";
      return styles;
    }

    // Statut ACCEPTÉE ou EN PRÉPARATION - Restaurant actif
    if (currentStatus === "EN COURS" || currentStatus === "EN PRÉPARATION") {
      styles.step1Bg = "bg-[#F17922]";
      styles.step1Icon = "/icons/poulet-blanc.png";
    }

    // Statut PRÊT - Restaurant et préparation actifs
    else if (currentStatus === "PRÊT") {
      styles.step1Bg = "bg-[#F17922]";
      styles.step1Icon = "/icons/poulet-blanc.png";
      styles.line1 = "bg-[#F17922]";
      styles.step2Bg = "bg-[#F17922]";
      styles.step2Icon = "/icons/package.png";
    }

    // Statut EN LIVRAISON - Restaurant, préparation actifs et livraison en cours
    else if (currentStatus === "LIVRAISON") {
      styles.step1Bg = "bg-[#F17922]";
      styles.step1Icon = "/icons/poulet-blanc.png";
      styles.line1 = "bg-[#F17922]";
      styles.step2Bg = "bg-[#F17922]";
      styles.step2Icon = "/icons/package.png";
    }

    // Statut LIVRÉ, COLLECTÉ, TERMINÉ ou COMPLETED - Tout est terminé
    else if (
      currentStatus === "LIVRÉ" ||
      currentStatus === "COLLECTÉ" ||
      currentStatus === "TERMINÉ" ||
      currentStatus === "COMPLETED"
    ) {
      styles.step1Bg = "bg-[#F17922]";
      styles.step1Icon = "/icons/poulet-blanc.png";
      styles.line1 = "bg-[#F17922]";
      styles.step2Bg = "bg-[#F17922]";
      styles.step2Icon = "/icons/package.png";
      styles.line2 = "bg-[#F17922]";
      styles.step3Bg = "bg-[#F17922]";
      styles.step3Icon = "/icons/location_white.png";
    }

    // Statut ANNULÉE - Style spécial pour les commandes annulées
    else if (currentStatus === "ANNULÉE") {
      styles.step1Border = "border-[#FF3B30]";
      styles.step1Bg = "bg-[#FF3B30]";
      styles.step1Icon = "/icons/poulet-blanc.png";
      styles.line1 = "bg-[#FFE8D7]";
      styles.step2Border = "border-[#FF3B30]";
      styles.step2Bg = "bg-white";
      styles.line2 = "bg-[#FFE8D7]";
      styles.step3Border = "border-[#FF3B30]";
      styles.step3Bg = "bg-white";
    }

    return styles;
  };

  // Fonction améliorée pour formater l'adresse avec gestion de tous les formats possibles
  const formatAddress = (addressInput: string | object | unknown) => {
    // Si l'adresse est vide ou non définie
    if (!addressInput) return "Adresse non disponible";

    try {
      // Si l'adresse est déjà une chaîne
      if (typeof addressInput === "string") {
        // Essayer de parser si c'est un JSON
        if (addressInput.startsWith("{") || addressInput.startsWith("[")) {
          try {
            const addressObj = JSON.parse(addressInput);
            return formatAddressObject(addressObj);
          } catch {
            // Si le parsing échoue, retourner la chaîne telle quelle
            return addressInput;
          }
        }
        // Sinon retourner la chaîne telle quelle
        return addressInput;
      }

      // Si l'adresse est un objet
      if (typeof addressInput === "object" && addressInput !== null) {
        return formatAddressObject(addressInput as Record<string, unknown>);
      }

      // Cas par défaut
      return String(addressInput) || "Adresse non disponible";
    } catch {
      return "Adresse non disponible";
    }
  };

  // Fonction auxiliaire pour formater un objet adresse
  const formatAddressObject = (addressObj: Record<string, unknown>) => {
    const parts: string[] = [];

    // Vérifier tous les champs possibles d'une adresse
    if (addressObj.title) parts.push(String(addressObj.title));
    if (addressObj.address) parts.push(String(addressObj.address));
    if (addressObj.road) parts.push(String(addressObj.road));
    if (addressObj.street) parts.push(String(addressObj.street));
    if (addressObj.street_number) parts.push(String(addressObj.street_number));
    if (addressObj.city) parts.push(String(addressObj.city));
    if (addressObj.postalCode || addressObj.postal_code)
      parts.push(String(addressObj.postalCode || addressObj.postal_code));
    if (addressObj.state) parts.push(String(addressObj.state));
    if (addressObj.country) parts.push(String(addressObj.country));

    // Si l'objet a une propriété formattedAddress, l'utiliser directement
    if (addressObj.formattedAddress) return String(addressObj.formattedAddress);

    // Sinon, joindre les parties disponibles
    return parts.join(", ") || "Adresse non disponible";
  };

  return (
    <div className="bg-white rounded-xl min-h-screen shadow-sm">
      <div className="">
        <div className="flex flex-col md:flex-row gap-4 md:gap-12 ">
          <div className="md:w-3/5 p-4 sm:p-6 h-auto ">
            {/* En-tête avec informations générales */}
            <div className="mb-4 md:mb-6">
              <div className="flex justify-between items-center">
                <h2 className="xl:text-lg text-sm font-medium text-[#F17922]">
                  Information sur la commande{" "}
                  <span className="text-xs font-bold ">#{orderReference}</span>
                </h2>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const workflowConfig = getWorkflowConfig(
                      orderType,
                      currentStatus
                    );
                    return (
                      <span className="px-3 py-1.5 border-1 border-[#FBD2B5] font-bold text-[#FF3B30] text-[10px] lg:text-xs rounded-lg">
                        {workflowConfig.badgeText}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Informations commande */}
              <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                <div className="flex  gap-40 items-center">
                  <p className="lg:text-sm text-xs text-gray-500">Restaurant</p>
                  <p className="font-bold text-[#F17922] lg:text-sm text-xs">
                    {restaurantName}
                  </p>
                </div>

                <div className="flex gap-26  items-center">
                  <p className="lg:text-sm text-xs font-medium text-[#71717A]">
                    Type de commande
                  </p>
                  <div className="inline-flex items-center  rounded-[10px] px-3 py-[4px] text-xs font-medium  bg-[#FBDBA7] text-[#71717A]">
                    {orderType}
                    <SafeImage
                      className="ml-2"
                      src="/icons/deliver.png"
                      alt="truck"
                      width={15}
                      height={15}
                    />
                  </div>
                </div>

                <div className="flex gap-22  items-center">
                  <p className="lg:text-sm text-xs font-medium text-[#71717A]">
                    Date de la commande
                  </p>
                  <p className="font-bold text-xs lg:text-sm text-[#71717A]">
                    {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>

                <div className="flex gap-41  items-center">
                  <p className="lg:text-sm text-xs font-medium text-[#71717A]">
                    Référence
                  </p>
                  <p className="font-bold text-xs lg:text-sm text-[#71717A]">
                    {orderReference}
                  </p>
                </div>

                <div className="flex gap-32  items-center">
                  <p className="lg:text-sm text-xs font-medium text-[#71717A]">
                    Mode paiement
                  </p>
                  <div className="flex items-center">
                    <p className="font-bold text-xs lg:text-sm text-[#71717A]">
                      {paymentMethod}
                    </p>
                  </div>
                </div>
                {order.note && (
                  <div className="flex gap-32  items-center">
                    <p className="lg:text-sm text-xs font-medium text-[#71717A]">
                      Note
                    </p>
                    <div className="flex items-center">
                      <p className="font-bold text-xs lg:text-sm text-[#71717A]">
                        {order.note}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-32  items-center">
                  <p className="lg:text-sm text-xs font-medium text-[#71717A]">
                    Statut paiement
                  </p>
                  <div className="flex items-center">
                    <PaymentBadge status={getPaymentStatus(order)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Détails de la commande */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-[#F17922]">
                Commande
              </h3>
              <div className="flex flex-row items-center justify-between mb-6">
                <span className="text-xs font-medium text-[#71717A]">
                  Coût de la commande
                </span>
                <span className="text-sm font-bold text-[#F17922]">
                  {totalPrice.toLocaleString()}F
                </span>
              </div>
              {/* Articles de la commande avec prix */}
              {orderItems && orderItems.length > 0 ? (
                orderItems.map((item) => {
                  return (
                    <div key={item.id || Math.random()}>
                      <div className="flex items-center">
                        <div className="w-16 h-12 my-2 rounded-lg mr-3 relative overflow-hidden">
                          <SafeImage
                            src={item.image}
                            alt={item.name || "Article"}
                            width={80}
                            height={64}
                            className="object-cover"
                          />
                          {/* Badge pour les articles offerts (prix = 0) */}
                          {item.price === 0 && (
                            <div className="absolute bottom-0 right-0 bg-[#F17922] text-white text-[8px] px-1 py-0.5 rounded-tl-md">
                              Offert
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-600">
                                  {item.name}
                                  {item.price === 0 && (
                                    <span className="ml-1 text-xs text-[#F17922] font-normal">
                                      (Offert)
                                    </span>
                                  )}
                                </p>
                                {item.epice && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    🌶️ Épicé
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                Quantité: {item.quantity}
                              </p>
                            </div>
                            <p
                              className={`text-sm font-bold ${
                                item.price === 0
                                  ? "text-[#F17922]"
                                  : "text-[#71717A]"
                              }`}
                            >
                              {item.price === 0
                                ? "Offert"
                                : `${item.price.toLocaleString()} F`}
                            </p>
                          </div>
                          {item.supplemens && (
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Suppléments :
                                </span>
                                <span className="text-xs text-gray-500">
                                  {item.supplemens}
                                </span>
                              </div>
                              <p className={`text-sm font-medium text-[#71717A]`}>
                                {`${item.supplementsPrice.toLocaleString()} F`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Aucun article dans cette commande</p>
                </div>
              )}
            </div>
          </div>

          {/* Partie droite (1/3) */}
          <div className="md:w-3/6 p-4 sm:p-6 pb-20 md:pb-6 bg-[#FBFBFB] h-auto overflow-y-auto md:overflow-visible">
            {/* Informations client */}
            <div className="mb-4 md:mb-8">
              <p className="text-[18px] font-medium text-[#F17922] mb-4">
                Client
              </p>
              <div className="flex flex-row items-center justify-between mb-4">
                <p className="text-sm text-[#71717A]">Client</p>
                <p className="text-sm text-[#71717A] font-bold">
                  {customerName}
                </p>
              </div>

              {/* Adresse */}
              <div className="flex flex-row justify-between items-start mb-4">
                <p className="text-sm text-[#71717A]">Adresse</p>
                <p className="text-sm text-[#71717A] font-bold text-right max-w-[250px]">
                  {formatAddress(customerAddress)}
                </p>
              </div>
              {customerEmail && (
                <div className="flex flex-row items-center justify-between mb-2">
                  <p className="text-sm text-[#71717A]">Email</p>
                  <p className="text-sm text-[#71717A] font-bold">
                    {customerEmail}
                  </p>
                </div>
              )}
              {customerPhone && (
                <div className="flex flex-row items-center justify-between mb-2">
                  <p className="text-sm text-[#71717A]">Téléphone</p>
                  <p className="text-sm text-[#71717A] font-bold">
                    {customerPhone}
                  </p>
                </div>
              )}
            </div>

            {/* Section livraison - Masquée pour PICKUP et TABLE */}
            {fullOrderDetails?.type !== "PICKUP" &&
              fullOrderDetails?.type !== "TABLE" && (
                <div className="mb-4 md:mb-8">
                  <p className="text-[18px] font-medium text-[#F17922] mb-4">
                    {getDeliverySectionTitle()}
                  </p>
                  <div className="bg-white p-5 px-2 border-[#F17922] border-1 rounded-xl">
                    <div className="flex justify-between items-center ">
                      {/* Étape 1 - Restaurant */}
                      <div
                        className={`w-10 h-10 rounded-[12px] border-1 ${
                          getProgressStyles().step1Border
                        } ${
                          getProgressStyles().step1Bg
                        } flex items-center justify-center transition-all duration-500 ease-in-out transform hover:scale-110`}
                      >
                        <SafeImage
                          src={getProgressStyles().step1Icon}
                          alt="restaurant"
                          width={24}
                          height={24}
                        />
                      </div>

                      {/* Ligne entre étape 1 et 2 */}
                      <div
                        className={`flex-1 h-1 ${
                          getProgressStyles().line1
                        } transition-all duration-500 ease-in-out`}
                      ></div>

                      {/* Étape 2 - Préparation */}
                      <div
                        className={`w-10 h-10 rounded-[12px] border-1 ${
                          getProgressStyles().step2Border
                        } ${
                          getProgressStyles().step2Bg
                        } flex items-center justify-center transition-all duration-500 ease-in-out transform hover:scale-110`}
                      >
                        <SafeImage
                          src={getProgressStyles().step2Icon}
                          alt="box"
                          width={24}
                          height={24}
                        />
                      </div>

                      {/* Ligne entre étape 2 et 3 */}
                      <div
                        className={`flex-1 h-1 ${
                          getProgressStyles().line2
                        } transition-all duration-500 ease-in-out`}
                      ></div>

                      {/* Étape 3 - Livraison */}
                      <div
                        className={`w-10 h-10 rounded-[12px] border-1 ${
                          getProgressStyles().step3Border
                        } ${
                          getProgressStyles().step3Bg
                        } flex items-center justify-center transition-all duration-500 ease-in-out transform hover:scale-110`}
                      >
                        <SafeImage
                          src={getProgressStyles().step3Icon}
                          alt="pin"
                          width={24}
                          height={24}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-3 md:mt-4 text-[#71717A]">
                    Processus de livraison proposé par{" "}
                    <span className="text-[#71717A] font-bold">
                      {fullOrderDetails?.delivery_service === "TURBO"
                        ? "Turbo Delivery"
                        : "Chicken Nation"}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="w-full mt-3 md:mt-4 py-3 px-4 bg-[#F17922] hover:bg-[#F17972] cursor-pointer rounded-xl flex items-center justify-center text-sm font-medium text-white"
                  >
                    <SafeImage
                      src="/icons/external-link.png"
                      alt="eye"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    <span>Voir le suivi de livraison</span>
                  </button>
                </div>
              )}

            {/* Informations de prix */}
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[#71717A]">Prix net</span>
                <span className="text-sm font-bold text-[#71717A]">
                  {(subtotal || totalPrice).toLocaleString()}F
                </span>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[#71717A]">Taxe</span>
                <span className="text-sm font-bold text-[#71717A]">
                  {tax ? `${tax.toLocaleString()}F` : "--"}
                </span>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[#71717A]">
                  Frais de livraison
                </span>
                <span className="text-sm font-bold text-[#71717A]">
                  {order.deliveryPrice
                    ? `${order.deliveryPrice.toLocaleString()}F`
                    : "--"}
                </span>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-[#71717A]">Réduction</span>
                <span className="text-sm font-bold text-[#71717A]">
                  {discount ? `${discount.toLocaleString()}F` : "--"}
                </span>
              </div>

              {/* Total de la commande */}
              <div className="flex justify-between items-center">
                <span className="text-[18px] font-medium text-[#F17922]">
                  Prix Total
                </span>
                <div className="bg-[#F17922] text-white px-6 py-2 rounded-xl font-bold">
                  {totalPrice.toLocaleString()}F
                </div>
              </div>

              {/* Nouveau système de workflow avec bouton unique - Protégé par RBAC */}
              {(() => {
                const workflowConfig = getWorkflowConfig(
                  orderType,
                  currentStatus
                );

                if (currentStatus === "NOUVELLE") {
                  // Pour les nouvelles commandes, garder les deux boutons avec contrôles RBAC
                  return (
                    <div className="mt-6 flex justify-between gap-4">
                      {canRejectCommande() && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onReject) {
                              onReject(order.id);
                            }
                          }}
                          className="w-full py-3 px-4 bg-white border border-[#FF3B30] hover:bg-gray-50 text-[#FF3B30] rounded-xl font-medium"
                        >
                          Refuser
                        </button>
                      )}
                      {canAcceptCommande() && (
                        <button
                          type="button"
                          onClick={handleWorkflowAction}
                          className="w-full py-3 px-4 bg-[#F17922] hover:bg-[#F17922] text-white rounded-xl font-medium"
                        >
                          {workflowConfig.buttonText}
                        </button>
                      )}
                      {!canAcceptCommande() && !canRejectCommande() && (
                        <div className="w-full text-center py-3 text-gray-500 text-sm">
                          Vous n&apos;avez pas les permissions pour gérer cette
                          commande
                        </div>
                      )}
                    </div>
                  );
                } else if (
                  workflowConfig.buttonText &&
                  currentStatus !== "PRÊT"
                ) {
                  // Pour les statuts EN COURS et EN PRÉPARATION, afficher bouton workflow + bouton annuler avec RBAC
                  return (
                    <div className="mt-6 flex justify-between gap-4">
                      {canRejectCommande() && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onReject) {
                              onReject(order.id);
                            }
                          }}
                          className="w-full py-3 px-4 bg-white border border-[#FF3B30] hover:bg-gray-50 text-[#FF3B30] rounded-xl font-medium"
                        >
                          Annuler
                        </button>
                      )}
                      {canUpdateCommande() && (
                        <button
                          type="button"
                          onClick={handleWorkflowAction}
                          className="w-full py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
                        >
                          {workflowConfig.buttonText}
                        </button>
                      )}

                      {!canUpdateCommande() && !canRejectCommande() && (
                        <div className="w-full text-center py-3 text-gray-500 text-sm">
                          Vous n&apos;avez pas les permissions pour modifier
                          cette commande
                        </div>
                      )}
                    </div>
                  );
                } else if (
                  workflowConfig.buttonText &&
                  currentStatus === "PRÊT"
                ) {
                  // Pour le statut PRÊT, afficher seulement le bouton de workflow avec RBAC
                  return (
                    <div className="mt-6">
                      {canUpdateCommande() ? (
                        <button
                          type="button"
                          onClick={handleWorkflowAction}
                          className="w-full py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
                        >
                          {workflowConfig.buttonText}
                        </button>
                      ) : (
                        <div className="w-full text-center py-3 text-gray-500 text-sm">
                          Vous n&apos;avez pas les permissions pour modifier
                          cette commande
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Aucun bouton si le workflow est terminé
                  return (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-500">Commande terminée</p>
                    </div>
                  );
                }
              })()}
              <button
                type="button"
                onClick={async () => {
                  const result = await handlePrintOrder(order.id);
                  console.log(result);
                }}
                className="w-full py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
              >
                {"Imprimer"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-2 md:top-4 left-2 md:left-4 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 z-10"
        aria-label="Retour à la liste des commandes"
      >
        <SafeImage
          src="/icons/arrow-left.png"
          alt="Retour"
          width={20}
          height={20}
          className="md:w-6 md:h-6"
        />
      </button>

      {/* Modal de confirmation pour terminer la commande */}
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
