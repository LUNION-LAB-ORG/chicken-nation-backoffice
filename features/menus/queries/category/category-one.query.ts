import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getCategorieById } from "../../services/category-service";
import { categoryKeyQuery } from "./index.query";

// Option de requête
export const categoryOneQueryOption = (categoryId: string) => {
	return {
		queryKey: categoryKeyQuery("one", categoryId),
		queryFn: async () => {
			const result = await getCategorieById(categoryId);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: !!categoryId,
	};
}

// Hook pour récupérer les restaurants
export const useCategoryOneQuery = (categoryId: string) => {
	const result = useQuery(categoryOneQueryOption(categoryId));
	
	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}
	}, [result]);

	return result;
};