import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { confirmKkiapayPayment } from "../services/order-service";
import { useInvalidateOrderQuery } from "./index.query";

export const useConfirmPaymentMutation = () => {
	const invalidateOrderQuery = useInvalidateOrderQuery()

	return useMutation({
		mutationFn: async (data: {
			id: string,
			transactionId: string
		}) => {
			const result = await confirmKkiapayPayment(data.id, data.transactionId);
			return result;
		},
		onSuccess: async () => {
			await invalidateOrderQuery();
			toast.success("Paiement confirmé — commande validée");
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};
