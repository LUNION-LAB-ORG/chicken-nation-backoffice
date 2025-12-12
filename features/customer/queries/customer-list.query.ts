import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getAllCustomers } from "../services/customer.service";
import { CustomerQuery } from "../types/customer.types";
import { customerKeyQuery } from "./index.query";

// Option de requête
export const customerListQueryOption = (query?: CustomerQuery) => {
	return {
		queryKey: customerKeyQuery("list", query),
		queryFn: async () => {
			const result = await getAllCustomers(query);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,// le délai de rafraîchissement
		enabled: true,
	};
}

// Hook pour récupérer les clients
export const useCustomerListQuery = (query?: CustomerQuery) => {
	const result = useQuery(customerListQueryOption(query));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};