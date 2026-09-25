import { ApercuCoupon } from "../types/coupon.types";

/** « 10 000 F » : montant arrondi au franc, séparateur de milliers français. */
export const formaterFrancs = (montant: number): string =>
    `${Math.round(montant || 0).toLocaleString("fr-FR")} F`;

/** « expire le 12/10 », l'année seulement si elle diffère de l'année en cours. */
export const formaterEcheance = (iso: string | null): string => {
    if (!iso) return "sans échéance";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "sans échéance";
    const memeAnnee = date.getFullYear() === new Date().getFullYear();
    return `expire le ${date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        ...(memeAnnee ? {} : { year: "numeric" }),
    })}`;
};

/** Première ligne du bandeau de succès, à partir de l'aperçu du serveur. */
export const phraseReduction = (apercu: ApercuCoupon): string => {
    if (apercu.type === "VOUCHER") {
        const reste = apercu.bon.solde_apres;
        return reste > 0
            ? `Bon ${apercu.code} : −${formaterFrancs(apercu.remise)}, il restera ${formaterFrancs(reste)} sur le bon.`
            : `Bon ${apercu.code} : −${formaterFrancs(apercu.remise)}, le bon sera entièrement utilisé.`;
    }
    const libelle = (apercu.libelle || "").trim().replace(/\.$/, "");
    return libelle
        ? `Code ${apercu.code} : ${libelle}. Réduction −${formaterFrancs(apercu.remise)}.`
        : `Code ${apercu.code} : réduction −${formaterFrancs(apercu.remise)}.`;
};
