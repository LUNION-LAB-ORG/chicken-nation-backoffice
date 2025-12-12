import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getDeliveryFee } from "../services/order-service";
import { orderKeyQuery } from "./index.query";

// Option de requête
export const deliveryFeeQueryOption = (query?: { lat: number, long: number, restaurant_id?: string }) => {
	return {
		queryKey: orderKeyQuery("delivery-fee", query),
		queryFn: async () => {
			const result = await getDeliveryFee(query);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: !!query,
	};
}

// Hook pour récupérer les clients
export const useDeliveryFeeQuery = (query?: { lat: number, long: number, restaurant_id?: string }) => {
	const result = useQuery(deliveryFeeQueryOption(query));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};