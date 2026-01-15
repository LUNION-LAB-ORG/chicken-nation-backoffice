import { useAuthStore } from "../../features/users/hook/authStore";
import { useUIStore } from "@/store/uiStore";
import { useEffect } from "react";

export function useWelcomeModals() {
    const { isAuthenticated, user } = useAuthStore();
    const { setShowPasswordChangeModal, setShowWelcomeBackModal } = useUIStore();

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        if (user.password_is_updated === false) {
            setShowPasswordChangeModal(true);
            setShowWelcomeBackModal(false);
        } else if (user.password_is_updated === true) {
            setShowWelcomeBackModal(true);
        }
        
    }, [isAuthenticated, user, setShowPasswordChangeModal, setShowWelcomeBackModal]);
}