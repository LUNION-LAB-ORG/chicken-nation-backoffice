import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { restaurantKeyQuery } from "./index.query";
import { getRestaurantManager } from "../services/restaurants-service";

// Option de requête
export const restaurantManagerListQueryOption = (id: string) => {
	return {
		queryKey: restaurantKeyQuery("restaurant-managers", id),
		queryFn: async () => {
			const result = await getRestaurantManager(id);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: !!id,
	};
}

// Hook pour récupérer les restaurants
export const useRestaurantManagerListQuery = (id: string) => {
	const result = useQuery(restaurantManagerListQueryOption(id));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};