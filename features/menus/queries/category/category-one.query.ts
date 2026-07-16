import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getCategorieById } from "../../services/category-service";
import { categoryKeyQuery } from "./index.query";

// Option de requête.
// `customerId` (optionnel) : en prise de commande, masque les plats selon
// l'audience du client cible. Fait partie de la clé de cache (une même catégorie
// n'a pas le même contenu selon le client). Absent → clé "all" (staff voit tout).
export const categoryOneQueryOption = (categoryId: string, customerId?: string) => {
	return {
		queryKey: categoryKeyQuery("one", categoryId, customerId ?? "all"),
		queryFn: async () => {
			const result = await getCategorieById(categoryId, customerId);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: !!categoryId,
	};
}

// Hook pour récupérer les restaurants
export const useCategoryOneQuery = (categoryId: string, customerId?: string) => {
	const result = useQuery(categoryOneQueryOption(categoryId, customerId));
	
	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}
	}, [result]);

	return result;
};