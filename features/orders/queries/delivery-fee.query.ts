import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getDeliveryFee, type DeliveryFeeQuery } from "../services/order-service";
import { orderKeyQuery } from "./index.query";

// Option de requête
export const deliveryFeeQueryOption = (query?: DeliveryFeeQuery) => {
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
export const useDeliveryFeeQuery = (query?: DeliveryFeeQuery) => {
	const result = useQuery(deliveryFeeQueryOption(query));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};