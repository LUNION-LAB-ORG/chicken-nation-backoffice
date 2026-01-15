import { useAuthStore } from "../../features/users/hook/authStore";
import { TabKey, useDashboardStore } from "@/store/dashboardStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuthRedirect() {
  const router = useRouter();

  const {
    selectedRestaurantId,
    setSelectedRestaurantId,
    activeTab,
    setActiveTab
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
    if (user && user.permissions.modules && !activeTab) {
      setActiveTab(Object.keys(user.permissions.modules)[0] as TabKey || "dashboard")
    }
  }, [user, activeTab])

  return { isAuthenticated };
}