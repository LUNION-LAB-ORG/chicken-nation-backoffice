import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { deleteOrder } from "../services/order-service";
import { useInvalidateOrderQuery } from "./index.query";

export const useOrderDeleteMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery()

	return useMutation({
		mutationFn: async (id: string) => {
			const result = await deleteOrder(id);
			return result;
		},
		onSuccess: async () => {
			await invalidateOrderQuery();
			toast.success("Commande supprimée avec succès");
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};