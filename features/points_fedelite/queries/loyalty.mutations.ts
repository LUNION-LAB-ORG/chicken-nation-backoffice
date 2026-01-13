import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useInvalidateLoyaltyQuery } from "./index.query";
import {
    addPoints,
    redeemPoints,
    expirePoints
} from "../services/loyalty.service";
import { AddLoyaltyPointDto, RedeemPointsDto } from "../types/loyalty.types";

// Mutation pour ajouter des points
export const useAddPointsMutation = () => {
    const invalidate = useInvalidateLoyaltyQuery();

    return useMutation({
        mutationFn: (data: AddLoyaltyPointDto) => addPoints(data),
        onSuccess: (_, variables) => {
            invalidate("customer-info", variables.customer_id);
            invalidate("points-breakdown", variables.customer_id);
            invalidate("points-list");
            toast.success("Points ajoutés avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// Mutation pour utiliser des points
export const useRedeemPointsMutation = () => {
    const invalidate = useInvalidateLoyaltyQuery();

    return useMutation({
        mutationFn: (data: RedeemPointsDto) => redeemPoints(data),
        onSuccess: (_, variables) => {
            invalidate("customer-info", variables.customer_id);
            invalidate("points-breakdown", variables.customer_id);
            invalidate("points-list");
            toast.success("Points utilisés avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// Mutation pour expirer les points
export const useExpirePointsMutation = () => {
    const invalidate = useInvalidateLoyaltyQuery();

    return useMutation({
        mutationFn: expirePoints,
        onSuccess: () => {
            invalidate("points-list");
            toast.success("Points expirés avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};