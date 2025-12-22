import { useCallback } from "react";
import { toast } from "react-hot-toast";
import { deleteOrder } from "@/services/orderService";
import { useOrderStore } from "@/store/orderStore";
import { useRBAC } from "@/hooks/useRBAC";

interface UseOrderActionsProps {
  refetch: () => void;
}

export const useOrderActions = ({ refetch }: UseOrderActionsProps) => {
  const { updateOrderStatus } = useOrderStore();
  const { canAcceptCommande, canRejectCommande, canDeleteCommande } = useRBAC();

  // Accepter une commande
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
        refetch();
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
    [refetch, canAcceptCommande, updateOrderStatus]
  );

  // Refuser une commande
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
        refetch();
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
    [refetch, canRejectCommande, updateOrderStatus]
  );

  // Masquer une commande
  const handleHideOrder = useCallback((orderId: string) => {
    toast.success(`Commande ${orderId} masquée de la liste`);
  }, []);

  // Supprimer une commande
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
        refetch();
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

  // Définir le temps de préparation
  const handleSetPreparationTime = useCallback(
    (orderId: string, preparationTime: number, deliveryTime: number) => {
      // TODO: Implémenter l'appel API
      console.log("Définir temps de préparation:", {
        orderId,
        preparationTime,
        deliveryTime,
        totalTime: preparationTime + deliveryTime,
      });

      toast.success(
        `Temps de préparation défini: ${
          preparationTime + deliveryTime
        } minutes (${preparationTime}min préparation + ${deliveryTime}min livraison)`
      );
    },
    []
  );

  return {
    handleAcceptOrder,
    handleRejectOrder,
    handleHideOrder,
    handleRemoveOrder,
    handleSetPreparationTime,
  };
};