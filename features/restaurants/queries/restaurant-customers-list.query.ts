import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getRestaurantCustomers } from "../services/restaurants-service";
import { restaurantKeyQuery } from "./index.query";

// Option de requête
export const restaurantCustomersListQueryOption = (id: string) => {
	return {
		queryKey: restaurantKeyQuery("restaurant-customers", id),
		queryFn: async () => {
			const result = await getRestaurantCustomers(id);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: !!id,
	};
}

// Hook pour récupérer les restaurants
export const useRestaurantCustomersListQuery = (id: string) => {
	const result = useQuery(restaurantCustomersListQueryOption(id));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};