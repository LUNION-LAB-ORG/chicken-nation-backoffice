
import { WorkflowConfig } from "../types/orderDetails.types";
import { OrderTableStatus, OrderTableType } from "../types/ordersTable.types";

export const getWorkflowConfig = (
    orderType: OrderTableType,
    currentStatus: OrderTableStatus
): WorkflowConfig => {
    switch (currentStatus) {
        case OrderTableStatus['ANNULÉE']:
            return {
                badgeText: "Annulée",
                buttonText: null,
                nextStatus: null,
                nextBadgeText: null,
            };
        case OrderTableStatus['NOUVELLE']:
            return {
                badgeText: "Nouvelle commande",
                buttonText: "Accepter",
                nextStatus: OrderTableStatus["EN COURS"],
                nextBadgeText: "En cours",
            };
        case OrderTableStatus["EN COURS"]:
            return {
                badgeText: "En cours",
                buttonText: "En préparation",
                nextStatus: OrderTableStatus["EN PRÉPARATION"],
                nextBadgeText: "En préparation",
            };
        case OrderTableStatus["EN PRÉPARATION"]:
            return {
                badgeText: "En préparation",
                buttonText: "Prêt",
                nextStatus: OrderTableStatus["PRÊT"],
                nextBadgeText: "Prêt",
            };
        case OrderTableStatus["PRÊT"]:
            return {
                badgeText: "Prêt",
                buttonText: "Terminer",
                nextStatus: OrderTableStatus["COLLECTÉ"],
                nextBadgeText: "Terminé",
            };
        case OrderTableStatus["COLLECTÉ"]:
        case OrderTableStatus["LIVRAISON"]:
        case OrderTableStatus["LIVRÉ"]:
        case OrderTableStatus["TERMINÉ"]:
            return {
                badgeText: "Terminé",
                buttonText: null,
                nextStatus: null,
                nextBadgeText: null,
            };
        default:
            return {
                badgeText: OrderTableStatus[currentStatus],
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
