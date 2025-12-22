import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { updateOrderStatus } from "../services/order-service";
import { OrderStatus } from "../types/order.types";
import { useInvalidateOrderQuery } from "./index.query";

export const useOrderUpdateMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery()

	return useMutation({
		mutationFn: async (data: {
			id: string,
			status: OrderStatus
		}) => {
			const result = await updateOrderStatus(data.id, data.status);
			return result;
		},
		onSuccess: async () => {
			await invalidateOrderQuery();
			toast.success("Commande mise à jour avec succès");
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};