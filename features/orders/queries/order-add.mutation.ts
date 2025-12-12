import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { prepareOrderData, validateOrderForm } from "../utils/orderFormValidation";
import { useInvalidateOrderQuery } from "./index.query";
import { OrderFormData } from "../types/order-form.types";
import { addOrder } from "../services/order-service";

export const useOrderAddMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery()

	return useMutation({
		mutationFn: async (data: OrderFormData) => {
			// Validation des données
			const validate = validateOrderForm(data)
			if (validate) {
				// Appel de l'API avec l'action
				const result = await addOrder(prepareOrderData(data));
				return result;
			} else {
				throw new Error("Erreur lors de l'ajout de la commande");
			}
		},
		onSuccess: async () => {
			await invalidateOrderQuery();
			toast.success("Commande ajoutée avec succès");
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};