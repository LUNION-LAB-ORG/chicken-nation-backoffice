import { getAuthToken } from "@/utils/authUtils";
import {
    ApercuCoupon,
    ApercuCouponDTO,
    BonClient,
    ErreurCoupon,
} from "../types/coupon.types";

const BASE = `${process.env.NEXT_PUBLIC_API_PREFIX}/orders/coupon`;

/**
 * Au-delà, la demande est abandonnée. Sans cette limite, un serveur muet
 * laissait la carte en « Vérification... » pour toujours, et l'envoi de la
 * commande restait bloqué sur « La vérification du code est en cours ».
 */
const DELAI_MAX_MS = 15_000;

const MESSAGE_SESSION = "Votre session a expiré. Reconnectez-vous puis vérifiez le code de nouveau.";
const MESSAGE_RESEAU = "Connexion au serveur impossible. Vérifiez la connexion puis réessayez.";
const MESSAGE_DELAI = "Le serveur ne répond pas. Réessayez dans un instant.";
const MESSAGE_ILLISIBLE =
    "La réponse du serveur est illisible : la réduction n'a pas été appliquée. Réessayez plus tard.";
export const MESSAGE_SANS_REDUCTION = "Ce code ne donne aucune réduction sur cette commande.";

const erreur = (message: string, status: number): ErreurCoupon =>
    Object.assign(new Error(message), { status });

/**
 * Les refus du serveur sont écrits pour l'agent (« Ce code promo a expiré »,
 * « Ce bon appartient à un autre client ») : on les affiche tels quels. Le
 * client HTTP commun ne convient pas ici, il remplace tout message de 404 par
 * « Ressource non trouvée », or « Aucun code promo ni bon ne correspond à ce
 * code » arrive justement en 404.
 *
 * Restent traduits : les messages techniques (garde, route absente, erreur de
 * validation en anglais, panne) qui n'aideraient personne au comptoir.
 */
const lireErreur = async (response: Response): Promise<ErreurCoupon> => {
    const { status } = response;
    let message: unknown;
    try {
        message = (await response.json())?.message;
    } catch {
        message = undefined;
    }
    const texte = typeof message === "string" ? message.trim() : "";

    if (status === 401) {
        return erreur(MESSAGE_SESSION, status);
    }
    if (status === 429) {
        return erreur("Trop de vérifications en peu de temps. Patientez une minute puis réessayez.", status);
    }
    if (status >= 500) {
        return erreur("Le serveur n'a pas pu vérifier le code. Réessayez dans un instant.", status);
    }
    // Route inconnue : serveur pas encore à jour. Rien ne part tant que ça dure.
    if (status === 404 && (!texte || texte.startsWith("Cannot "))) {
        return erreur("La vérification des réductions n'est pas encore disponible. Réessayez plus tard.", status);
    }
    if (status === 403 && (!texte || texte === "Forbidden resource")) {
        return erreur("Votre compte ne permet pas d'appliquer une réduction.", status);
    }
    // Tableau de messages = validation automatique du corps, rédigée en anglais.
    if (!texte) {
        return erreur("Le code n'a pas pu être vérifié. Vérifiez le client, le restaurant et les articles.", status);
    }
    return erreur(texte, status);
};

const requete = async (chemin: string, init: RequestInit = {}): Promise<unknown> => {
    const token = getAuthToken();
    if (!token) {
        throw erreur(MESSAGE_SESSION, 401);
    }

    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), DELAI_MAX_MS);
    try {
        let response: Response;
        try {
            response = await fetch(`${BASE}${chemin}`, {
                ...init,
                signal: controleur.signal,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
        } catch {
            throw erreur(controleur.signal.aborted ? MESSAGE_DELAI : MESSAGE_RESEAU, 0);
        }

        if (!response.ok) throw await lireErreur(response);

        try {
            return await response.json();
        } catch {
            // Corps coupé ou non JSON : jamais le message technique du navigateur.
            throw erreur(controleur.signal.aborted ? MESSAGE_DELAI : MESSAGE_ILLISIBLE, response.status);
        }
    } finally {
        clearTimeout(minuteur);
    }
};

const estMontant = (valeur: unknown): valeur is number =>
    typeof valeur === "number" && Number.isFinite(valeur);

/**
 * Contrôle de la réponse de l'aperçu AVANT qu'elle serve. Un champ absent ou
 * renommé côté serveur ne doit ni faire planter le formulaire (montant
 * `undefined` affiché), ni laisser partir un code dont la remise est inconnue.
 * Une remise nulle n'est pas appliquée : le code serait consommé pour rien.
 */
const lireApercu = (brut: unknown): ApercuCoupon => {
    const a = (brut ?? {}) as Record<string, unknown>;
    const bon = (a.bon ?? {}) as Record<string, unknown>;
    const forme =
        (a.type === "PROMO_CODE" || a.type === "VOUCHER") &&
        typeof a.code === "string" &&
        a.code.trim() !== "" &&
        estMontant(a.remise) &&
        (a.type !== "VOUCHER" || estMontant(bon.solde_apres));
    if (!forme) throw erreur(MESSAGE_ILLISIBLE, 200);
    if ((a.remise as number) <= 0) throw erreur(MESSAGE_SANS_REDUCTION, 200);
    return brut as ApercuCoupon;
};

/** Ne garde que les bons lisibles : jamais de ligne vide ni de montant `undefined`. */
const lireBons = (brut: unknown): BonClient[] => {
    const data = (brut as { data?: unknown } | null)?.data;
    if (!Array.isArray(data)) return [];
    return data.filter((b): b is BonClient => {
        const bon = (b ?? {}) as Record<string, unknown>;
        return (
            typeof bon.id === "string" &&
            typeof bon.code_masque === "string" &&
            bon.code_masque.trim() !== "" &&
            estMontant(bon.solde)
        );
    });
};

export const couponAPI = {
    /** Recalcule la remise côté serveur sur le panier transmis. N'écrit rien. */
    apercu: async (dto: ApercuCouponDTO): Promise<ApercuCoupon> =>
        lireApercu(await requete("/apercu", { method: "POST", body: JSON.stringify(dto) })),

    /** Bons actifs du client, code masqué, 20 au plus, échéance la plus proche d'abord. */
    bonsClient: async (customerId: string): Promise<BonClient[]> =>
        lireBons(await requete(`/bons-client/${encodeURIComponent(customerId)}`, { method: "GET" })),
};
