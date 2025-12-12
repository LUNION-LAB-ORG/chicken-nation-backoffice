import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { RestaurantQuery } from "../types/restaurant.types";
import { restaurantKeyQuery } from "./index.query";
import { getAllRestaurants } from "../services/restaurants-service";

// Option de requête
export const restaurantListQueryOption = (query?: RestaurantQuery) => {
	return {
		queryKey: restaurantKeyQuery("list", query),
		queryFn: async () => {
			const result = await getAllRestaurants(query);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: true,
	};
}

// Hook pour récupérer les restaurants
export const useRestaurantListQuery = (query?: RestaurantQuery) => {
	const result = useQuery(restaurantListQueryOption(query));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};