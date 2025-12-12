import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getAllDishes } from "../services/dish-service";
import { dishKeyQuery } from "./index.query";

// Option de requête
export const dishListQueryOption = () => {
	return {
		queryKey: dishKeyQuery("list"),
		queryFn: async () => {
			const result = await getAllDishes();
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: true,
	};
}

// Hook pour récupérer les restaurants
export const useDishListQuery = () => {
	const result = useQuery(dishListQueryOption());

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};