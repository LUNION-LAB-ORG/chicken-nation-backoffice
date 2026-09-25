import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBonsClientQuery, useInvalidateBonsClient } from "../queries/bons-client.query";
import { useApercuCouponMutation } from "../queries/coupon-apercu.mutation";
import {
    ApercuCoupon,
    EnvoiCoupon,
    ErreurCoupon,
    EtatCoupon,
    ReductionAffichee,
} from "../types/coupon.types";
import { OrderFormData } from "../types/order-form.types";
import { normaliserCode, preparerArticles } from "../utils/orderFormValidation";

/** Délai avant de revérifier après un changement de panier : on attend la fin de la saisie. */
const DELAI_REVERIFICATION_MS = 400;
export const LONGUEUR_MAX_CODE = 64;

export const MESSAGE_CODE_NON_VERIFIE = "Le code saisi n'a pas été vérifié. Vérifiez-le ou retirez-le.";
const MESSAGE_VERIFICATION_EN_COURS = "La vérification du code est en cours. Patientez un instant.";

const estMontant = (valeur: unknown): valeur is number =>
    typeof valeur === "number" && Number.isFinite(valeur);

interface Params {
    formData: OrderFormData;
    customerNeedsSave: boolean;
    /** Création par un rôle qui peut créer une commande. Toujours faux en modification. */
    actif: boolean;
}

/**
 * Carte « Réduction » de la prise de commande. L'état vit à part du formData :
 * le code ne part au serveur que depuis un aperçu réussi, pour la commande
 * exacte qui a été vérifiée (même client, type, restaurant et panier).
 */
export const useCouponCommande = ({ formData, customerNeedsSave, actif }: Params) => {
    const [saisie, setSaisie] = useState("");
    const [etat, setEtat] = useState<EtatCoupon>({ statut: "vide" });
    const { mutateAsync: demanderApercu } = useApercuCouponMutation();
    const invaliderBons = useInvalidateBonsClient();
    // Numéro de la dernière demande : une réponse dépassée par une plus récente est ignorée.
    const derniereDemande = useRef(0);

    const articles = useMemo(() => preparerArticles(formData.items), [formData.items]);

    // L'ordre compte : pendant la saisie d'un nouveau client, `customer_id`
    // contient encore l'identifiant du client précédent. `customerNeedsSave`
    // peut aussi rester levé sur une fiche vide après une remise à zéro.
    const nouveauClientSaisi =
        customerNeedsSave && !!(formData.fullname || formData.phone || formData.email);
    let aide: string | null = null;
    if (actif) {
        if (nouveauClientSaisi) aide = "Enregistrez d'abord le nouveau client.";
        else if (customerNeedsSave || !formData.customer_id || formData.items.length === 0)
            aide = "Choisissez d'abord le client et au moins un article.";
        else if (!formData.restaurant_id) aide = "Choisissez d'abord le restaurant qui prépare la commande.";
    }
    const contexteValide = actif && aide === null;

    // Client de la commande. Un nouveau client pas encore enregistré n'est pas
    // `customer_id` (qui désigne encore le précédent) : la réduction vérifiée
    // pour l'ancien client ne doit plus compter.
    const client = customerNeedsSave ? "(nouveau client)" : formData.customer_id ?? "";
    const empreinte = useMemo(
        () => JSON.stringify([client, formData.type, formData.restaurant_id ?? "", articles]),
        [client, formData.type, formData.restaurant_id, articles],
    );

    const lancer = useCallback(
        async (code: string, precedent?: ApercuCoupon) => {
            const numero = ++derniereDemande.current;
            const empreinteDemandee = empreinte;
            setEtat({ statut: "verification", code, precedent });
            try {
                const apercu = await demanderApercu({
                    code,
                    customer_id: formData.customer_id ?? "",
                    restaurant_id: formData.restaurant_id ?? "",
                    type: formData.type,
                    items: articles,
                });
                if (numero !== derniereDemande.current) return;
                setEtat({ statut: "applique", apercu, empreinte: empreinteDemandee });
                setSaisie("");
            } catch (e) {
                if (numero !== derniereDemande.current) return;
                const message = (e as ErreurCoupon)?.message || "Le code n'a pas pu être vérifié.";
                // Le code revient dans le champ : l'agent le corrige, le revérifie ou le retire.
                setSaisie(code);
                setEtat({ statut: "erreur", code, message });
            }
        },
        [empreinte, demanderApercu, formData.customer_id, formData.restaurant_id, formData.type, articles],
    );

    // Revérification automatique : panier, client, type ou restaurant changés après un succès.
    useEffect(() => {
        if (etat.statut !== "applique" || etat.empreinte === empreinte || !contexteValide) return;
        const { apercu } = etat;
        const minuteur = setTimeout(() => void lancer(apercu.code, apercu), DELAI_REVERIFICATION_MS);
        return () => clearTimeout(minuteur);
    }, [etat, empreinte, contexteValide, lancer]);

    const changerSaisie = (valeur: string) => {
        setSaisie(valeur.toUpperCase().slice(0, LONGUEUR_MAX_CODE));
        if (etat.statut === "erreur") setEtat({ statut: "vide" });
    };

    const verifier = () => {
        const code = normaliserCode(saisie);
        // Pas de nouvel aperçu par-dessus une réduction posée : un seul coupon.
        if (!code || !contexteValide || etat.statut === "verification" || etat.statut === "applique") return;
        setSaisie(code);
        void lancer(code);
    };

    const retirer = useCallback(() => {
        derniereDemande.current++;
        setEtat({ statut: "vide" });
        setSaisie("");
    }, []);

    /** Après une création réussie ou une annulation du formulaire. */
    const reinitialiser = useCallback(() => {
        retirer();
        void invaliderBons();
    }, [retirer, invaliderBons]);

    /**
     * Garde de l'envoi. Le code part seulement s'il a été vérifié pour la
     * commande telle qu'elle est maintenant ; un code saisi sans vérification
     * bloque l'envoi au lieu d'être ignoré en silence.
     */
    const pourEnvoi = (): EnvoiCoupon => {
        if (!actif) return { ok: true };
        if (etat.statut === "verification") return { ok: false, message: MESSAGE_VERIFICATION_EN_COURS };
        if (etat.statut === "applique") {
            if (etat.empreinte === empreinte) return { ok: true, code_promo: etat.apercu.code };
            return {
                ok: false,
                message: contexteValide ? MESSAGE_VERIFICATION_EN_COURS : MESSAGE_CODE_NON_VERIFIE,
            };
        }
        if (normaliserCode(saisie)) return { ok: false, message: MESSAGE_CODE_NON_VERIFIE };
        return { ok: true };
    };

    /**
     * Le serveur a refusé la création alors qu'un code était envoyé (bon
     * consommé entre-temps, par exemple) : on redemande l'aperçu, la carte
     * affiche alors le motif exact ou garde la réduction si elle tient.
     */
    const apresEchecCreation = (code: string) => {
        setSaisie(code);
        void lancer(code);
    };

    const aJour = actif && etat.statut === "applique" && etat.empreinte === empreinte;

    /**
     * Ligne « Réduction » des totaux ; `montant` à null tant que la réduction
     * n'est pas confirmée. Carte inactive : rien, puisque `pourEnvoi` n'enverra
     * pas de code (une remise affichée mais jamais demandée tromperait le client).
     */
    let reduction: ReductionAffichee | undefined;
    if (!actif) {
        reduction = undefined;
    } else if (etat.statut === "applique") {
        const { apercu } = etat;
        reduction = aJour
            ? {
                  libelle: apercu.code,
                  montant: apercu.remise,
                  // Le total affiché est celui du serveur, pas celui du catalogue de l'écran.
                  ...(estMontant(apercu.sous_total) && { sousTotal: apercu.sous_total }),
                  ...(estMontant(apercu.total_articles_apres_remise) && {
                      totalArticles: apercu.total_articles_apres_remise,
                  }),
              }
            : { libelle: apercu.code, montant: null };
    } else if (etat.statut === "verification" && etat.precedent) {
        reduction = { libelle: etat.precedent.code, montant: null };
    }

    const bons = useBonsClientQuery(
        actif && !customerNeedsSave && formData.customer_id ? formData.customer_id : undefined,
    );

    return {
        actif,
        saisie,
        changerSaisie,
        etat,
        aide,
        contexteValide,
        aJour,
        reduction,
        bons: bons.data ?? [],
        verifier,
        retirer,
        reinitialiser,
        pourEnvoi,
        apresEchecCreation,
    };
};

export type CouponCommande = ReturnType<typeof useCouponCommande>;
