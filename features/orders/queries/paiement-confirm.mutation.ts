import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { confirmerEncaissement } from "../services/paiement-service";
import { useInvalidateOrderQuery } from "./index.query";

/**
 * Confirmation d'un encaissement livreur (Turbo) EN ATTENTE.
 *
 * Côté backend : paiement PENDING → SUCCESS (claim atomique), commande marquée
 * payée et TERMINÉE si elle est déjà livrée (même cascade que l'ajout de
 * paiement caissière). On invalide donc les mêmes caches que l'ajout de
 * paiement : détail commande, listes d'opérations, courses.
 */
export const usePaiementConfirmMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (paiementId: string) => confirmerEncaissement(paiementId),
		onSuccess: async (result) => {
			await Promise.all([
				invalidateOrderQuery(),
				queryClient.invalidateQueries({ queryKey: ["operations"] }),
				queryClient.invalidateQueries({ queryKey: ["courses"] }),
			]);
			toast.success(result.message || "Encaissement confirmé");
		},
		onError: (e: Error) => {
			toast.error(e.message);
		},
	});
};
