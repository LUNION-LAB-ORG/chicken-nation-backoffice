import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { restaurantKeyQuery } from "./index.query";
import { getRestaurantUsers } from "../services/restaurants-service";

// Option de requête
export const restaurantUsersListQueryOption = (id: string) => {
	return {
		queryKey: restaurantKeyQuery("restaurant-users", id),
		queryFn: async () => {
			const result = await getRestaurantUsers(id);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: !!id,
	};
}

// Hook pour récupérer les restaurants
export const useRestaurantUsersListQuery = (id: string) => {
	const result = useQuery(restaurantUsersListQueryOption(id));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};