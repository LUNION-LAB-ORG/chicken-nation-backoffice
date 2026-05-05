import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { addPaiement } from "../services/paiement-service";
import { OrderTable } from "../types/ordersTable.types";
import { PaiementMode } from "../types/paiement.types";
import { preparePaiementData, validatePaiementForm } from "../utils/paiementFormValidation";
import { useInvalidateOrderQuery } from "./index.query";

export const usePaiementAddMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery();
	const queryClient = useQueryClient();

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
			// FIX TEMPS RÉEL OPS : un paiement change le statut de l'Order côté
			// backend (paied=true → potentiellement COMPLETED), ce qui doit
			// retirer la card de la liste « Opérations actives ». Sans cette
			// invalidation, le drawer se met à jour mais la card reste affichée
			// avec son ancien statut « Livrée ».
			await Promise.all([
				invalidateOrderQuery(),
				queryClient.invalidateQueries({ queryKey: ["operations"] }),
				queryClient.invalidateQueries({ queryKey: ["courses"] }),
			]);
			toast.success("Paiement ajouté avec succès");
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};