import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { getCustomerById } from "../services/customer.service";
import { customerKeyQuery } from "./index.query";

// Option de requête
export const customerDetailQueryOption = (id: string) => {
	return {
		queryKey: customerKeyQuery("detail", id),
		queryFn: async () => {
			const result = await getCustomerById(id);
			return result;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,
		enabled: !!id,
	};
}

// Hook pour récupérer les clients
export const useCustomerDetailQuery = (id?: string) => {
	const result = useQuery(customerDetailQueryOption(id));

	React.useEffect(() => {
		if (result.isError || result.error) {
			toast.error(result.error?.message);
		}

	}, [result]);

	return result;
};