
import { WorkflowConfig } from "../types/orderDetails.types";

export const getWorkflowConfig = (
    orderType: string,
    currentStatus: string
): WorkflowConfig => {
    switch (currentStatus) {
        case "NOUVELLE":
            return {
                badgeText: "Nouvelle commande",
                buttonText: "Accepter",
                nextStatus: "EN COURS",
                nextBadgeText: "En cours",
            };
        case "EN COURS":
            return {
                badgeText: "En cours",
                buttonText: "En préparation",
                nextStatus: "EN PRÉPARATION",
                nextBadgeText: "En préparation",
            };
        case "EN PRÉPARATION":
            return {
                badgeText: "En préparation",
                buttonText: "Prêt",
                nextStatus: "PRÊT",
                nextBadgeText: "Prêt",
            };
        case "PRÊT":
            return {
                badgeText: "Prêt",
                buttonText: "Terminer",
                nextStatus: "COLLECTÉ",
                nextBadgeText: "Terminé",
            };
        case "COLLECTÉ":
        case "LIVRAISON":
        case "LIVRÉ":
        case "TERMINÉ":
            return {
                badgeText: "Terminé",
                buttonText: null,
                nextStatus: null,
                nextBadgeText: null,
            };
        default:
            return {
                badgeText: currentStatus,
                buttonText: null,
                nextStatus: null,
                nextBadgeText: null,
            };
    }
};

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