import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { prepareOrderData, validateOrderForm } from "../utils/orderFormValidation";
import { useInvalidateOrderQuery } from "./index.query";
import { OrderFormData } from "../types/order-form.types";
import { updateOrder } from "../services/order-service";

export const useOrderUpdateMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery()

	return useMutation({
		mutationFn: async (data: {
			id: string,
			data: Partial<OrderFormData>
		}) => {
			// Validation des données
			const validate = validateOrderForm(data.data)
			if (validate) {
				const orderData = prepareOrderData(data.data)
				const result = await updateOrder(data.id, orderData);
				return result;
			} else {
				throw new Error("Erreur lors de la mise à jour de la commande");
			}
		},
		onSuccess: async (commande) => {
			await invalidateOrderQuery();
			toast.success("Commande mise à jour avec succès");
			// Panier annulé par le client, réactivé sans sa remise : l'agent
			// doit annoncer le nouveau total au client avant de raccrocher.
			const avertissement = commande?.avertissement_reprise?.trim();
			if (avertissement) {
				toast(avertissement, { icon: "⚠️", duration: 12000 });
			}
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};