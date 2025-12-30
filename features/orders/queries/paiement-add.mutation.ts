import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { addPaiement } from "../services/paiement-service";
import { OrderTable } from "../types/ordersTable.types";
import { PaiementMode } from "../types/paiement.types";
import { preparePaiementData, validatePaiementForm } from "../utils/paiementFormValidation";
import { useInvalidateOrderQuery } from "./index.query";

export const usePaiementAddMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery()

	return useMutation({
		mutationFn: async (data: {
			items: { mode: PaiementMode; amount: number; source: string }[],
			order: OrderTable
		}) => {
			// Validation des données
			const validate = validatePaiementForm(
				data.items,
				data.order.amount
			)
			if (validate) {
				const orderData = preparePaiementData(data.items, data.order.id, data.order.customerId)
				const result = await addPaiement(orderData);
				return result;
			} else {
				throw new Error("Erreur lors de l'ajout du paiement");
			}
		},
		onSuccess: async () => {
			await invalidateOrderQuery();
			toast.success("Paiement ajouté avec succès");
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};