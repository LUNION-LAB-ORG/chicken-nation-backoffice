import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { updatePaiement } from "../services/paiement-service";
import { Paiement, PaiementMode, PaiementStatus } from "../types/paiement.types";
import { useInvalidateOrderQuery } from "./index.query";

interface UpdatePaiementInput {
    id: string;
    patch: Partial<Pick<Paiement, "amount" | "mode" | "source" | "status">>;
}

/** PATCH /paiements/:id — Modification d'un paiement existant.
 *  - Admin uniquement (le backend retourne 403 sinon).
 *  - Le backend recalcule automatiquement `order.paied` après modification. */
export const usePaiementUpdateMutation = () => {
    const invalidateOrderQuery = useInvalidateOrderQuery();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, patch }: UpdatePaiementInput) => updatePaiement(id, patch),
        onSuccess: async () => {
            // Invalider toutes les sources liées : drawer commande, listing Ops, courses
            await Promise.all([
                invalidateOrderQuery(),
                queryClient.invalidateQueries({ queryKey: ["operations"] }),
                queryClient.invalidateQueries({ queryKey: ["courses"] }),
            ]);
            toast.success("Paiement mis à jour");
        },
        onError: (e: Error) => {
            toast.error(e.message || "Échec de la mise à jour du paiement");
        },
    });
};

// Re-exports pour confort des consumers
export type { PaiementMode, PaiementStatus };
