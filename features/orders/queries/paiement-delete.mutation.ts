import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { deletePaiement } from "../services/paiement-service";
import { useInvalidateOrderQuery } from "./index.query";

/** DELETE /paiements/:id — Suppression d'un paiement existant.
 *  - Admin uniquement (le backend retourne 403 sinon).
 *  - Le backend recalcule automatiquement `order.paied` après suppression
 *    (peut faire repasser la commande de "payée" → "non payée" si le total
 *    perçu restant ne couvre plus le montant dû). */
export const usePaiementRemoveMutation = () => {
    const invalidateOrderQuery = useInvalidateOrderQuery();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePaiement(id),
        onSuccess: async () => {
            await Promise.all([
                invalidateOrderQuery(),
                queryClient.invalidateQueries({ queryKey: ["operations"] }),
                queryClient.invalidateQueries({ queryKey: ["courses"] }),
            ]);
            toast.success("Paiement supprimé");
        },
        onError: (e: Error) => {
            toast.error(e.message || "Échec de la suppression du paiement");
        },
    });
};
