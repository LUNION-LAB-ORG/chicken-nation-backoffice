import { User } from "@/services";
import { useAuthStore } from '@/store/authStore';
import { DashboardState, useDashboardStore } from "@/store/dashboardStore";


export interface SoundContext {
    user: User | null;
    dashboardState: DashboardState;
}

export const useSoundContext = () => {
    const { user } = useAuthStore();
    const dashboardState = useDashboardStore();
    return {
        user,
        dashboardState,
    };
};