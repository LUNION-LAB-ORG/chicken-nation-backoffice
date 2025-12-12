import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { addCustomer } from "../services/customer.service";
import { CustomerAddForm } from "../types/customer-form.types";
import { prepareCustomerData, validateCustomerForm } from "../utils/customerFormValidation";
import { useInvalidateCustomerQuery } from "./index.query";

export const useCustomerAddMutation = () => {
	const invalidateCustomerQuery = useInvalidateCustomerQuery()

	return useMutation({
		mutationFn: async (data: CustomerAddForm) => {
			// Validation des données
			const validate = validateCustomerForm(data)
			if (validate) {
				// Appel de l'API avec l'action
				const result = await addCustomer(prepareCustomerData(data));
				return result;
			} else {
				throw new Error("Erreur lors de l'ajout du client");
			}
		},
		onSuccess: async () => {
			await invalidateCustomerQuery();
			toast.success("Client ajouté avec succès");
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};