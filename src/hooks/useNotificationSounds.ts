import { useAuthStore } from "@/store/authStore";
import { useMessagesSound } from "@/hooks/useMessagesSound";
import { usePendingOrdersSound } from "@/hooks/usePendingOrdersSound";

export function useNotificationSounds() {
  const { user } = useAuthStore();

  const pendingOrders = usePendingOrdersSound({
    activeFilter: "all",
    selectedRestaurant: user?.role !== "ADMIN" ? user?.restaurant_id : undefined,
    disabledSound: false,
  });

  const messages = useMessagesSound({
    disabledSound: false,
  });

  return {
    pendingOrders,
    messages,
  };
}