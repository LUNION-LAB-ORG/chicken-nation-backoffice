import { OrderAddress } from "../types/order.types";

// Parser l'adresse si elle existe (pour l'afficher dans le composant)
export const getParsedAddress = (address: string): OrderAddress | null => {
    if (!address) return null;

    try {
        // Si c'est déjà un objet
        if (typeof address === 'object') {
            return address;
        }
        // Si c'est une string JSON
        return JSON.parse(address);
    } catch (e) {
        return null;
    }
};