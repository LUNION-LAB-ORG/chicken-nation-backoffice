/**
 * Titre de la section "Suivi" dans le détail d'une commande, dérivé de son
 * statut affiché (libellé OrderTableStatus, pas l'enum brut).
 *
 * NB : les libellés ont changé après refacto :
 *  - "EN LIVRAISON"  = PICKED_UP (livreur a pris, DELIVERY uniquement)
 *  - "RÉCUPÉRÉE"     = COLLECTED (client a reçu / récupéré, tous types)
 */
export const getDeliverySectionTitle = (
    orderType: string | undefined,
    currentStatus: string,
) => {
    if (orderType === "PICKUP" || orderType === "À récupérer" || orderType === "TABLE" || orderType === "À table") {
        switch (currentStatus) {
            case "PRÊT":
                return "Prêt à récupérer";
            case "RÉCUPÉRÉE":
                return "Récupérée par le client";
            case "TERMINÉE":
                return "Terminée";
            case "EN COURS":
                return "En cours de préparation";
            case "EN PRÉPARATION":
                return "En préparation";
            case "ANNULÉE":
                return "Annulée";
            default:
                return "Suivi de la commande";
        }
    }

    // DELIVERY
    switch (currentStatus) {
        case "EN LIVRAISON":
            return "En livraison";
        case "RÉCUPÉRÉE":
            return "Livrée au client";
        case "TERMINÉE":
            return "Terminée";
        case "PRÊT":
            return "Prête, en attente du livreur";
        case "EN COURS":
            return "En cours de préparation";
        case "EN PRÉPARATION":
            return "En préparation";
        case "ANNULÉE":
            return "Annulée";
        default:
            return "Suivi de la commande";
    }
};
