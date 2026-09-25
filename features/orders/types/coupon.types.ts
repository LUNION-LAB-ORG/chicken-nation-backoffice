import { SupplementItem } from "./order-form.types";
import { OrderType } from "./order.types";

/**
 * RÉDUCTION À LA PRISE DE COMMANDE : code promo (coupons CRM compris) ou bon
 * d'achat nominatif. Le serveur calcule tout : l'écran n'envoie jamais de
 * montant, il affiche celui que le serveur renvoie.
 */

/** Ligne d'article dans la forme exacte de la création (`POST /orders/create`). */
export interface ArticleCommandeDTO {
    dish_id: string;
    quantity: number;
    /** `undefined` quand la ligne n'a aucun supplément (la clé disparaît du JSON). */
    supplements: SupplementItem[] | undefined;
    epice: boolean;
    option_item_ids?: string[];
}

/** Corps de `POST /orders/coupon/apercu`. */
export interface ApercuCouponDTO {
    code: string;
    customer_id: string;
    restaurant_id: string;
    type: OrderType;
    items: ArticleCommandeDTO[];
}

interface ApercuCouponCommun {
    /** Code normalisé par le serveur (majuscules, sans espaces autour). */
    code: string;
    /** Remise sur les articles, en francs. Jamais la livraison ni la taxe. */
    remise: number;
    /** Sous-total des articles recalculé par le serveur. */
    sous_total: number;
    total_articles_apres_remise: number;
    /** Phrase prête à afficher, écrite par le serveur. */
    libelle: string;
}

export interface ApercuCodePromo extends ApercuCouponCommun {
    type: "PROMO_CODE";
    code_promo: {
        discount_type: "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y";
        discount_value: number;
        max_discount_amount: number | null;
        min_order_amount: number | null;
        target_type: "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "CATEGORIES";
        expiration_date: string | null;
    };
}

export interface ApercuBon extends ApercuCouponCommun {
    type: "VOUCHER";
    bon: {
        solde: number;
        solde_apres: number;
        expire_le: string | null;
    };
}

/** Réponse de `POST /orders/coupon/apercu`. */
export type ApercuCoupon = ApercuCodePromo | ApercuBon;

/**
 * Un bon du client, code MASQUÉ (décision D3) : le client doit dicter le code
 * complet, la liste ne sert qu'à savoir qu'il en possède un.
 */
export interface BonClient {
    id: string;
    code_masque: string;
    solde: number;
    montant_initial: number;
    expire_le: string | null;
}

/** Réponse de `GET /orders/coupon/bons-client/:customerId`. */
export interface BonsClientReponse {
    data: BonClient[];
}

/** Erreur d'une route coupon : message prêt à afficher et statut HTTP (0 = réseau). */
export interface ErreurCoupon extends Error {
    status: number;
}

/**
 * État de la carte « Réduction ».
 * - `applique` garde l'empreinte de la commande vérifiée : si le panier, le
 *   client, le type ou le restaurant change, la réduction n'est plus comptée
 *   jusqu'à la nouvelle vérification.
 * - `verification` garde l'aperçu précédent pendant une revérification, pour
 *   ne pas faire disparaître le bandeau.
 */
export type EtatCoupon =
    | { statut: "vide" }
    | { statut: "verification"; code: string; precedent?: ApercuCoupon }
    | { statut: "applique"; apercu: ApercuCoupon; empreinte: string }
    | { statut: "erreur"; code: string; message: string };

/** Ce que l'envoi de la commande doit faire du coupon. */
export type EnvoiCoupon =
    | { ok: true; code_promo?: string }
    | { ok: false; message: string };

/** Ligne « Réduction » des totaux. `montant` à null : vérification en cours, rien n'est déduit. */
export interface ReductionAffichee {
    libelle?: string;
    montant: number | null;
    /**
     * Chiffres du serveur pour le panier vérifié (aperçu à jour seulement) :
     * les totaux affichés les reprennent tels quels, pour égaler le montant que
     * la création enregistrera. Absents : l'écran calcule avec son catalogue.
     */
    sousTotal?: number;
    totalArticles?: number;
}
