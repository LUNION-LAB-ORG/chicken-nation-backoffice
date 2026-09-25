import { useMutation } from "@tanstack/react-query";
import { couponAPI } from "../apis/coupon.api";
import { ApercuCoupon, ApercuCouponDTO, ErreurCoupon } from "../types/coupon.types";

/**
 * Aperçu d'un code promo ou d'un bon sur le panier en cours. Pas de toast :
 * la carte « Réduction » affiche le refus du serveur sous le champ.
 */
export const useApercuCouponMutation = () =>
    useMutation<ApercuCoupon, ErreurCoupon, ApercuCouponDTO>({
        mutationFn: (dto) => couponAPI.apercu(dto),
    });
