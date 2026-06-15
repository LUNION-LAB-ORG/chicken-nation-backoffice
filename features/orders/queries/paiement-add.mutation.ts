import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { addPaiement } from "../services/paiement-service";
import { updateOrderStatus } from "../services/order-service";
import { OrderStatus } from "../types/order.types";
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
			order: OrderTable,
			/** Reste réellement dû (total − déjà encaissé). Défaut = total commande. */
			amountDue?: number,
		}) => {
			// Validation : on doit couvrir le RESTE DÛ, pas le total commande
			// (cas paiement partiel : un acompte a déjà pu être encaissé).
			const validate = validatePaiementForm(
				data.items,
				data.amountDue ?? data.order.amount
			)
			if (!validate) {
				throw new Error("Erreur lors de l'ajout du paiement");
			}

			const orderData = preparePaiementData(data.items, data.order.id, data.order.customerId)
			const paiementResult = await addPaiement(orderData);

			// Auto-complete : si la commande était déjà COLLECTED (le client a
			// reçu / récupéré) et qu'on vient juste de l'encaisser, on bascule
			// directement vers COMPLETED. Évite la session « COLLECTED non payée »
			// qui restait suspendue en attente d'un clic manuel sur « Terminer ».
			if (data.order.rawStatus === OrderStatus.COLLECTED) {
				try {
					await updateOrderStatus(data.order.id, OrderStatus.COMPLETED);
				} catch (err) {
					// L'auto-complete est best-effort : si le backend refuse (ex.
					// transition déjà appliquée par un autre device), on ignore
					// l'erreur — le paiement, lui, a bien été enregistré.
					console.warn("Auto-complete COLLECTED → COMPLETED a échoué (non bloquant):", err);
				}
			}

			return paiementResult;
		},
		onSuccess: async () => {
			// FIX TEMPS RÉEL OPS : un paiement change le statut de l'Order côté
			// backend (paied=true → potentiellement COMPLETED), ce qui doit
			// retirer la card de la liste « Opérations actives ». Sans cette
			// invalidation, le drawer se met à jour mais la card reste affichée
			// avec son ancien statut.
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