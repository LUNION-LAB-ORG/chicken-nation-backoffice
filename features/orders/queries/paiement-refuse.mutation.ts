import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { refuserEncaissement } from "../services/paiement-service";
import { useInvalidateOrderQuery } from "./index.query";

/**
 * Refus d'un encaissement déclaré par le livreur (18/11).
 *
 * Côté serveur : paiement EN ATTENTE → échec (claim atomique), avec le nom de
 * qui l'a refusé. La commande ne bouge pas : la caisse peut ensuite encaisser
 * le bon montant. Mêmes caches que la confirmation.
 */
export const usePaiementRefuseMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (paiementId: string) => refuserEncaissement(paiementId),
		onSuccess: async (result) => {
			await Promise.all([
				invalidateOrderQuery(),
				queryClient.invalidateQueries({ queryKey: ["operations"] }),
				queryClient.invalidateQueries({ queryKey: ["courses"] }),
			]);
			toast.success(result.message || "Encaissement refusé");
		},
		onError: (e: Error) => {
			toast.error(e.message);
		},
	});
};
