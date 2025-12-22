
import { PaymentStatus } from "@/components/gestion/Orders/PaymentBadge";
import { OrderStatus } from "../types/order.types";
import { Order } from "../types/ordersTable.types";

// 🎯 Déterminer le statut de paiement
export const getPaymentStatus = (order: Order): PaymentStatus => {
    if (
        order.status === "ANNULÉE" &&
        order.paiements &&
        order.paiements.length > 0
    ) {
        const hasRevertedPayment = order.paiements?.some(
            (p) => p.status === "REVERTED"
        );
        return hasRevertedPayment ? "REFUNDED" : "TO_REFUND";
    }
    if (order.paied == false) {
        return "UNPAID";
    }
    return "PAID";
};

// Récupération du token d'authentification
export function getAuthToken() {
    try {
        if (typeof document === "undefined") return null;

        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split("=");
            if (name === "chicken-nation-token") {
                return decodeURIComponent(value);
            }
        }

        console.error("Token non trouvé dans les cookies");
        return null;
    } catch (error) {
        console.error("Erreur lors de la récupération du token:", error);
        return null;
    }
}

// Validation et nettoyage de l'URL d'image


// Formater un objet adresse
export const formatAddressObject = (addressObj: Record<string, unknown>) => {
    const parts: string[] = [];

    if (addressObj.title) parts.push(String(addressObj.title));
    if (addressObj.address) parts.push(String(addressObj.address));
    if (addressObj.road) parts.push(String(addressObj.road));
    if (addressObj.street) parts.push(String(addressObj.street));
    if (addressObj.street_number) parts.push(String(addressObj.street_number));
    if (addressObj.city) parts.push(String(addressObj.city));
    if (addressObj.postalCode || addressObj.postal_code)
        parts.push(String(addressObj.postalCode || addressObj.postal_code));
    if (addressObj.state) parts.push(String(addressObj.state));
    if (addressObj.country) parts.push(String(addressObj.country));

    if (addressObj.formattedAddress) return String(addressObj.formattedAddress);

    return parts.join(", ") || "Adresse non disponible";
};

// Formater l'adresse avec gestion de tous les formats possibles
export const formatAddress = (addressInput: string | object | unknown) => {
    if (!addressInput) return "Adresse non disponible";

    try {
        if (typeof addressInput === "string") {
            if (addressInput.startsWith("{") || addressInput.startsWith("[")) {
                try {
                    const addressObj = JSON.parse(addressInput);
                    return formatAddressObject(addressObj);
                } catch {
                    return addressInput;
                }
            }
            return addressInput;
        }

        if (typeof addressInput === "object" && addressInput !== null) {
            return formatAddressObject(addressInput as Record<string, unknown>);
        }

        return String(addressInput) || "Adresse non disponible";
    } catch {
        return "Adresse non disponible";
    }
};