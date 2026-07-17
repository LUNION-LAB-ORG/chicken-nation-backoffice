import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useInvalidateCardNationQuery } from "./index.query";
import {
    deleteCard,
    deleteRequest,
    previewCard,
    regenerateCard,
    reviewRequest,
    updateCardStatus,
} from "../services/carte-nation.service";
import {
    CardLevel,
    CardRequestStatus,
    CardVisual,
    PreviewCardBody,
} from "../types/carte-nation.types";

// Mutation pour traiter une demande de carte.
// À l'approbation : `level` (couleur) + `is_student` (marqueur) — 2 axes, cahier §4.5.
export const useReviewRequestMutation = () => {
    const invalidate = useInvalidateCardNationQuery();

    return useMutation({
        mutationFn: ({
            id,
            data,
            photo,
        }: {
            id: string;
            data: {
                status: CardRequestStatus;
                rejection_reason?: string;
                level?: CardLevel;
                is_student?: boolean;
            };
            /** Photo recadrée par le staff avant génération (optionnelle). */
            photo?: File;
        }) => reviewRequest(id, data, photo),
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

// Régénère le visuel d'une carte (niveau + marqueur étudiant ; numéro/QR conservés).
export const useRegenerateCardMutation = () => {
    const invalidate = useInvalidateCardNationQuery();

    return useMutation({
        mutationFn: ({ id, visual }: { id: string; visual: CardVisual }) =>
            regenerateCard(id, visual),
        onSuccess: () => {
            invalidate("cards-list");
            toast.success("Carte régénérée");
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
