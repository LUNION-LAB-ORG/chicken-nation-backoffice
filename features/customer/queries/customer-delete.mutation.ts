import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { deleteCustomer } from "../services/customer.service";
import { useInvalidateCustomerQuery } from "./index.query";

export const useCustomerDeleteMutation = () => {
	const invalidateCustomerQuery = useInvalidateCustomerQuery();

	return useMutation({
		mutationFn: async (id: string) => {
			return await deleteCustomer(id);
		},
		onSuccess: async () => {
			await invalidateCustomerQuery();
			toast.success("Client supprimé avec succès");
		},
		onError: async (e) => {
			toast.error(e.message || "Erreur lors de la suppression du client");
		},
	});
};
