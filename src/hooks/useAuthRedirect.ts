import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuthRedirect() {
  const router = useRouter();

  const {
    selectedRestaurantId,
    setSelectedRestaurantId,
  } = useDashboardStore();
  const { user, isAuthenticated } = useAuthStore();
  
  // Réridiger sur la page de connexion si pas authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  // Placer restaurant ID lors
  useEffect(() => {
    if (user && user.restaurant_id && !selectedRestaurantId) {
      setSelectedRestaurantId(user.restaurant_id)
    }
  }, [user])

  return { isAuthenticated };
}