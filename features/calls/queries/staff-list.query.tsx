import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../users/services/user.service";
import { callsKeyQuery } from "./index.query";

/** Liste de tout le staff (pour l'appel individuel P2P — admin). */
export const useStaffListQuery = () =>
  useQuery({
    queryKey: callsKeyQuery("staff"),
    queryFn: () => getAllUsers(),
    staleTime: 5 * 60 * 1000,
  });
