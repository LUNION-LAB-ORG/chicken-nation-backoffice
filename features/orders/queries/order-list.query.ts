import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getAllOrders } from "../services/order-service";
import { orderKeyQuery } from "./index.query";
import { OrderQuery } from "../types/order.types";

// Option de requête
export const orderListQueryOption = (query?: OrderQuery, enabled: boolean = true) => {
	return {
		queryKey: orderKeyQuery("list", query),
		queryFn: async () => {
			const result = await getAllOrders(query);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled,
	};
}

// Hook pour récupérer les clients
export const useOrderListQuery = (query?: OrderQuery, enabled?: boolean) => {
	const result = useQuery(orderListQueryOption(query, enabled));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};