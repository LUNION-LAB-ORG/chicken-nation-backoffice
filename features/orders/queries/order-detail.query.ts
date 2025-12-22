import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getOrderById } from "../services/order-service";
import { orderKeyQuery } from "./index.query";

// Option de requête
export const orderDetailQueryOption = (id: string) => {
	return {
		queryKey: orderKeyQuery("detail", id),
		queryFn: async () => {
			const result = await getOrderById(id);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: !!id,
	};
}

// Hook pour récupérer les clients
export const useOrderDetailQuery = (id: string) => {
	const result = useQuery(orderDetailQueryOption(id));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};