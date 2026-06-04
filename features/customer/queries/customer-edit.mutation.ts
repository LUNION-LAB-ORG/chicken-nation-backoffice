import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { CustomerUpdatePayload, updateCustomer } from "../services/customer.service";
import { useInvalidateCustomerQuery } from "./index.query";

/**
 * Modification des infos d'identité d'un client (prénom, nom, email, téléphone)
 * par un agent backoffice. Invalide la liste ET le détail du client.
 */
export const useCustomerUpdateMutation = () => {
	const invalidateCustomerQuery = useInvalidateCustomerQuery();

	return useMutation({
		mutationFn: async (vars: { id: string; payload: CustomerUpdatePayload }) => {
			return updateCustomer(vars.id, vars.payload);
		},
		onSuccess: async () => {
			await invalidateCustomerQuery();
			toast.success("Informations du client mises à jour");
		},
		onError: async (e: Error) => {
			toast.error(e.message);
		},
	});
};
