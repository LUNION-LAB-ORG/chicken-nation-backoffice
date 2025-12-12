import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getAllCategories } from "../../services/category-service";
import { categoryKeyQuery } from "./index.query";

// Option de requête
export const categoryListQueryOption = () => {
	return {
		queryKey: categoryKeyQuery("list"),
		queryFn: async () => {
			const result = await getAllCategories();
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: true,
	};
}

// Hook pour récupérer les restaurants
export const useCategoryListQuery = () => {
	const result = useQuery(categoryListQueryOption());

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};