import { OrderStatus } from "../types/order.types";
import { OrderTable } from "../types/ordersTable.types";
import { PaiementStatus } from "../types/paiement.types";

/** Refus du serveur annoncés avant l'envoi (mêmes textes que `OrderService.update`). */
export const MESSAGE_COMMANDE_PAYEE = "Commande payée : la réduction ne peut plus changer.";
export const MESSAGE_NON_CUMUL = "Non-cumul : cette commande utilise déjà des points (ou une promotion).";
export const MESSAGE_REPRISE = "Reprenez d'abord la commande, puis changez son coupon.";
export const MESSAGE_ANNULEE = "Commande annulée : la réduction ne peut plus changer.";

export interface CouponModification {
    /** La commande porte un bon ou un code promo, que l'agent peut retirer. */
    aUnCoupon: boolean;
    /**
     * Pourquoi la réduction ne peut pas changer sur cette commande ; `null`
     * quand l'agent peut appliquer un coupon ou retirer celui en place.
     */
    motifFige: string | null;
}

/**
 * Ce que l'écran « Modifier la commande » peut faire du coupon. Miroir des
 * refus du serveur, pour ne pas proposer une saisie qui finirait en 409 :
 * commande payée en tout ou partie, panier annulé repris au téléphone (la
 * réactivation refuse tout changement de coupon), commande annulée (le bon a
 * déjà été rendu à l'annulation), points ou promotion déjà utilisés.
 */
export const couponModification = (commande: OrderTable, reactivation: boolean): CouponModification => {
    const aUnCoupon = !!commande.codePromo;
    const payee =
        commande.paied || (commande.paiements ?? []).some((p) => p.status === PaiementStatus.SUCCESS);
    const nonCumul = commande.points > 0 || !!commande.promotionId;

    let motifFige: string | null = null;
    if (payee) motifFige = MESSAGE_COMMANDE_PAYEE;
    else if (reactivation) motifFige = MESSAGE_REPRISE;
    else if (commande.rawStatus === OrderStatus.CANCELLED) motifFige = MESSAGE_ANNULEE;
    else if (nonCumul && !aUnCoupon) motifFige = MESSAGE_NON_CUMUL;

    return { aUnCoupon, motifFige };
};
