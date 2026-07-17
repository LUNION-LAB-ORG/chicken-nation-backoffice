import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useInvalidateCardNationQuery } from "./index.query";
import {
    deleteCard,
    deleteRequest,
    previewCard,
    reviewRequest,
    updateCardStatus,
} from "../services/carte-nation.service";
import {
    CardRequestStatus,
    CardType,
    PreviewCardBody,
} from "../types/carte-nation.types";

// Mutation pour traiter une demande de carte.
// `card_type` : type de carte choisi à l'approbation (pilote le visuel émis).
export const useReviewRequestMutation = () => {
    const invalidate = useInvalidateCardNationQuery();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { status: CardRequestStatus; rejection_reason?: string; card_type?: CardType };
        }) => reviewRequest(id, data),
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

// ⚠️ Suppression DÉFINITIVE d'une demande (+ sa carte si déjà générée).
export const useDeleteRequestMutation = () => {
    const invalidate = useInvalidateCardNationQuery();

    return useMutation({
        mutationFn: (id: string) => deleteRequest(id),
        onSuccess: () => {
            invalidate("requests-list");
            toast.success("Demande supprimée définitivement");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// ⚠️ Suppression DÉFINITIVE d'une carte (+ son image).
export const useDeleteCardMutation = () => {
    const invalidate = useInvalidateCardNationQuery();

    return useMutation({
        mutationFn: (id: string) => deleteCard(id),
        onSuccess: () => {
            invalidate("cards-list");
            toast.success("Carte supprimée définitivement");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// Aperçu d'un design de carte (galerie / testeur). Aucune écriture : rien à invalider.
export const usePreviewCardMutation = () => {
    return useMutation({
        mutationFn: (data: PreviewCardBody) => previewCard(data),
        onError: (e: Error) => toast.error(e.message),
    });
};
