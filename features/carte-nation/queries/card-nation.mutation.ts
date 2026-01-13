import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useInvalidateCardNationQuery } from "./index.query";
import { reviewRequest, updateCardStatus } from "../services/carte-nation.service";
import { CardRequestStatus } from "../types/carte-nation.types";

// Mutation pour traiter une demande de carte
export const useReviewRequestMutation = () => {
    const invalidate = useInvalidateCardNationQuery();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { status: CardRequestStatus; rejection_reason?: string } }) =>
            reviewRequest(id, data),
        onSuccess: () => {
            invalidate("requests-list");
            toast.success("Demande traitée avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// Mutation pour mettre à jour le statut d'une carte
export const useUpdateCardStatusMutation = () => {
    const invalidate = useInvalidateCardNationQuery();

    return useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'suspend' | 'revoke' | 'activate' }) =>
            updateCardStatus(id, action),
        onSuccess: (_, variables) => {
            invalidate("cards-list");
            const messages = {
                suspend: "Carte suspendue",
                revoke: "Carte révoquée",
                activate: "Carte réactivée"
            };
            toast.success(messages[variables.action]);
        },
        onError: (e: Error) => toast.error(e.message),
    });
};