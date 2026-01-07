import { formatImageUrl } from "@/utils/imageHelpers"
import { dateToLocalString } from "../../../utils/date/format-date"
import { Comment } from "../../comments/types/comment.types"
import { Order, OrderStatus } from "../../orders/types/order.types"
import { mapApiOrdersToUiOrders } from "../../orders/utils/orderMapper"
import { Address } from "../types/address.type"
import { CUSTOMER_LOYALTY_POINT_TYPE_MAP, CustomerMapperData, CUSTOMER_STATUS_MAP } from "../types/customer-mapper.types"
import { Customer, LoyaltyLevel, LoyaltyPointType } from "../types/customer.types"
import { Favorite } from "../types/favorite.types"

/**
 * Extrait le nom complet du client
 */
const extractFullName = (customer: Customer): string => {
    const { first_name, last_name } = customer

    if (first_name && last_name) {
        return `${first_name} ${last_name}`.trim()
    }

    if (first_name) return first_name.trim()
    if (last_name) return last_name.trim()

    return "Client inconnu"
}

/**
 * Formate la date d'inscription
 */
const formatMemberSince = (dateString: string): string => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
    } catch {
        return "Inconnu"
    }
}

/**
 * Calcule les statistiques du client
 */
const calculateStats = (customer: Customer) => {
    const orders = customer.orders.filter(order => order.status == OrderStatus.COMPLETED) || []
    const favorites = customer.favorites || []
    const loyaltyPoints = customer.total_points || 0

    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0)

    return {
        totalOrders,
        totalSpent,
        loyaltyPoints,
        favorites: favorites.length,
    }
}

/**
 * Mappe l'historique de fidélité
 */
const mapLoyaltyHistory = (loyaltyPoints?: Customer["loyalty_points"]) => {
    if (!loyaltyPoints || loyaltyPoints.length === 0) return []

    // Trier par date décroissante
    const sortedPoints = [...loyaltyPoints].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
    })

    return sortedPoints.map((point) => ({
        id: point.id,
        type: CUSTOMER_LOYALTY_POINT_TYPE_MAP[point.type] || "Gagné",
        points: point.type === LoyaltyPointType.REDEEMED ? point.points_used : point.points,
        reason: point.reason || `Transaction ${point.order_id ? `#${point.order_id.slice(0, 8)}` : ""}`,
        date: dateToLocalString(new Date(point?.created_at)),
    }))
}

/**
 * Mappe les plats favoris
 */
const mapFavoriteDishes = (favorites?: Favorite[]) => {
    if (!favorites || favorites.length === 0) return []

    return favorites
        .filter((fav) => fav.dish) // S'assurer que le plat existe
        .map((fav) => ({
            id: fav.dish!.id,
            name: fav.dish!.name,
            category: fav.dish!.category?.name || "Non catégorisé",
            price: fav.dish!.price,
            image: formatImageUrl(fav.dish!.image),
            addedDate: dateToLocalString(new Date(fav.created_at)),
        }))
}

/**
 * Mappe les avis/commentaires
 */
const mapReviews = (comments?: Comment[], orders?: Order[]) => {
    if (!comments || comments.length === 0) return []

    // Créer un map des commandes pour accès rapide
    const orderMap = new Map(orders?.map((o) => [o.id, o]) || [])

    // Trier par date décroissante
    const sortedComments = [...comments].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
    })

    return sortedComments.map((comment) => {
        const order = comment.order || orderMap.get(comment.order_id)

        return {
            id: comment.id,
            rating: comment.rating,
            comment: comment.message,
            date: dateToLocalString(new Date(comment.created_at)),
            dishName: undefined, // Peut être enrichi si disponible
            orderRef: order?.reference || `ORD-${comment.order_id.slice(0, 8)}`,
        }
    })
}

/**
 * Mappe les adresses
 */
const mapAddresses = (addresses?: Address[]) => {
    if (!addresses || addresses.length === 0) return []

    return addresses.map((addr) => ({
        id: addr.id,
        title: addr.title,
        fullAddress: addr.address,
        city: addr.city,
        latitude: addr.latitude,
        longitude: addr.longitude,
    }))
}

// ========================================
// FONCTION DE MAPPING PRINCIPALE
// ========================================

/**
 * Mappe un Customer vers CustomerMapperData
 */
export const mapCustomerData = (customer: Customer): CustomerMapperData => {
    return {
        // Informations de base
        id: customer.id,
        fullName: extractFullName(customer),
        email: customer.email,
        phone: customer.phone,
        image: formatImageUrl(customer.image, "/icons/account.png"),

        // Statut et niveau
        status: CUSTOMER_STATUS_MAP[customer.entity_status],
        memberSince: formatMemberSince(customer.created_at),
        loyaltyLevel: customer.loyalty_level,

        // Statistiques
        stats: calculateStats(customer),

        // Commandes récentes
        recentOrders: mapApiOrdersToUiOrders(customer.orders),

        // Historique de fidélité
        loyaltyHistory: mapLoyaltyHistory(customer.loyalty_points),

        // Plats favoris
        favoriteDishes: mapFavoriteDishes(customer.favorites),

        // Avis
        reviews: mapReviews(customer.Comment, customer.orders),

        // Adresses
        addresses: mapAddresses(customer.addresses),

        // Cartes nationales
        cardRequests: customer.cardRequests || [],
        nationCards: customer.nationCards || [],

    }
}

// ========================================
// FONCTIONS D'EXPORT SUPPLÉMENTAIRES
// ========================================

/**
 * Mappe plusieurs clients
 */
export const mapCustomersData = (customers: Customer[]): CustomerMapperData[] => {
    return customers.map(mapCustomerData)
}

/**
 * Vérifie si un client est éligible pour une mise à niveau de niveau de fidélité
 */
export const isEligibleForLoyaltyUpgrade = (customer: Customer): boolean => {
    const currentLevel = customer.loyalty_level || LoyaltyLevel.STANDARD
    const points = customer.total_points || 0

    // Logique de mise à niveau (exemple)
    if (currentLevel === LoyaltyLevel.STANDARD && points >= 1000) return true
    if (currentLevel === LoyaltyLevel.PREMIUM && points >= 5000) return true

    return false
}

/**
 * Calcule le pourcentage vers le niveau suivant
 */
export const calculateLoyaltyProgress = (customer: Customer): number => {
    const currentLevel = customer.loyalty_level || LoyaltyLevel.STANDARD
    const points = customer.total_points || 0

    if (currentLevel === LoyaltyLevel.GOLD) return 100 // Niveau max atteint

    const thresholds = {
        [LoyaltyLevel.STANDARD]: { next: 1000 },
        [LoyaltyLevel.PREMIUM]: { next: 5000 },
        [LoyaltyLevel.GOLD]: { next: 0 },
    }

    const threshold = thresholds[currentLevel].next
    if (threshold === 0) return 100

    return Math.min((points / threshold) * 100, 100)
}

/**
 * Obtient le montant moyen des commandes
 */
export const getAverageOrderAmount = (customer: Customer): number => {
    if (!customer.orders || customer.orders.length === 0) return 0

    const total = customer.orders.reduce((sum, order) => sum + order.amount, 0)
    return Math.round(total / customer.orders.length)
}
