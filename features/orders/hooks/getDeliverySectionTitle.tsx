

export const getDeliverySectionTitle = (
    orderType: string | undefined,
    currentStatus: string
) => {
    if (orderType === "PICKUP") {
        switch (currentStatus) {
            case "PRÊT":
                return "Prêt à récupérer";
            case "RÉCUPÉRÉ":
                return "Récupéré";
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

    switch (currentStatus) {
        case "LIVRAISON":
            return "En livraison";
        case "LIVRÉ":
            return "Livré";
        case "RÉCUPÉRÉ":
            return "Récupéré";
        case "PRÊT":
            return "Prêt à emporter";
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
