import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { deleteOrder } from "../services/order-service";
import { orderKeyQuery } from "./index.query";

export const useOrderDeleteMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const result = await deleteOrder(id);
			return result;
		},
		onSuccess: async (_, id) => {
			// On rafraîchit tout le cache des commandes SAUF le détail de celle
			// qu'on vient de supprimer : il est encore affiché (tiroir, fiche) au
			// moment où l'on invalide, et le relancer répondrait 404 (bouton
			// bloqué sur « Suppression... », notifications d'erreur, nouvel essai).
			// Le détail n'est PAS retiré du cache : un observateur encore monté le
			// recréerait et le relancerait aussitôt. Il disparaît seul une fois le
			// tiroir fermé (délai de nettoyage du cache).
			const cleDetail = orderKeyQuery("detail", id);
			const saufCommandeSupprimee = (query: Query) =>
				!cleDetail.every((morceau, i) => query.queryKey[i] === morceau);

			await queryClient.cancelQueries({ queryKey: cleDetail, exact: true });
			await queryClient.invalidateQueries({
				queryKey: orderKeyQuery(),
				exact: false,
				predicate: saufCommandeSupprimee,
			});
			await queryClient.refetchQueries({
				queryKey: orderKeyQuery(),
				type: "active",
				predicate: saufCommandeSupprimee,
			});
			toast.success("Commande supprimée avec succès");
		},
		onError: async (e) => {
			toast.error(e.message);
		},
	});
};
