import { useAuthStore } from '../../users/hook/authStore';
import { DashboardState, useDashboardStore } from "@/store/dashboardStore";
import { User } from '../../users/types/user.types';


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