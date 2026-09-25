import { useAuthStore } from '../../users/hook/authStore';
import { Action, Modules } from '../../users/types/auth.type';
import { useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { mapToValueLabel } from "../../../utils/list/mapToValueLabel";
import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";
import { useOrderAddMutation } from "../queries/order-add.mutation";
import { useOrderUpdateMutation } from "../queries/order-update.mutation";
import { OrderFormData } from "../types/order-form.types";
import { OrderType } from "../types/order.types";
import { OrderTable, OrderTableType } from "../types/ordersTable.types";
import { validateOrderForm } from "../utils/orderFormValidation";
import { useDashboardStore } from "@/store/dashboardStore";
import { useCouponCommande } from "./useCouponCommande";

// Mapping inverse : type UI → type API
const ORDER_TYPE_REVERSE_MAP: Record<OrderTableType, OrderType> = {
    "À livrer": OrderType.DELIVERY,
    "À récupérer": OrderType.PICKUP,
    "À table": OrderType.TABLE,
};

const buildFormDataFromOrder = (order: OrderTable, userId: string): OrderFormData => {
    return {
        type: ORDER_TYPE_REVERSE_MAP[order.orderType] || OrderType.DELIVERY,
        // Utiliser l'adresse brute (JSON) pour conserver lat/long pour les frais de livraison
        address: order.rawAddress || order.address || "",
        date: order.date || "",
        time: "",
        fullname: order.clientName || "",
        phone: order.clientPhone || "",
        email: order.clientEmail || "",
        note: order.note || "",
        items: order.items.map((item) => ({
            dish_id: item.dishId, // ✅ Utiliser dishId (pas item.id qui est l'order_item id)
            quantity: item.quantity,
            // ✅ Restaurer les suppléments depuis rawSupplements
            supplements: (item.rawSupplements || []).map((s) => ({
                id: s.id,
                quantity: s.quantity || 1,
            })),
            // Sans cette reprise, enregistrer une commande composable après
            // modification effacerait la sauce et le format déjà payés.
            option_item_ids: (item.options ?? []).map((o) => o.id),
            epice: item.epice,
        })),
        customer_id: order.customerId || "",
        restaurant_id: order.restaurantId || "",
        auto: order.auto,
        user_id: userId,
        delivery_fee: order.deliveryFee || 0,
    };
};

/** Formulaire vierge : départ, après une création réussie et après « Annuler ». */
const formulaireVide = (userId: string): OrderFormData => ({
    type: OrderType.DELIVERY,
    address: "",
    date: "",
    time: "",
    fullname: "",
    phone: "",
    email: "",
    note: "",
    items: [],
    customer_id: "",
    restaurant_id: "",
    auto: false,
    user_id: userId,
    delivery_fee: 0,
});

export const useOrderForm = (editOrder?: OrderTable) => {
    const { user, can } = useAuthStore();
    const { setSectionView } = useDashboardStore();
    const isEditMode = !!editOrder;

    const initialFormData = useMemo(() => {
        if (editOrder) {
            return buildFormDataFromOrder(editOrder, user.id);
        }
        return formulaireVide(user.id);
    }, [editOrder, user.id]);

    const [formData, setFormData] = useState<OrderFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Verrou synchrone : l'état `isSubmitting` n'est vu qu'au rendu suivant.
    // Deux envois dans le même intervalle créeraient deux commandes et, avec
    // un bon assez garni, le débiteraient deux fois.
    const envoiEnCours = useRef(false);

    // Charger les restaurants
    const { data: restaurants, isLoading: isLoadingRestaurants } = useRestaurantListQuery();

    const [customerNeedsSave, setCustomerNeedsSave] = useState(false);

    const handleCustomerChange = (
        customerId: string | null,
        needsSave: boolean
    ) => {
        setCustomerNeedsSave(needsSave);
        if (customerId) {
            setFormData((prev) => ({ ...prev, customer_id: customerId }));
        } else if (!needsSave) {
            // Fiche client vidée : l'identifiant du client choisi auparavant
            // restait en place, invisible. La commande, et une réduction
            // vérifiée pour lui, seraient parties à son nom.
            setFormData((prev) => (prev.customer_id ? { ...prev, customer_id: "" } : prev));
        }
    };

    // Réduction (code promo ou bon) : création seulement, rôles qui créent une
    // commande (ADMIN, CALL_CENTER, CAISSIER). En modification, lecture seule.
    const coupon = useCouponCommande({
        formData,
        customerNeedsSave,
        actif: !isEditMode && can(Modules.COMMANDES, Action.CREATE),
    });

    // Mutations
    const { mutateAsync: addOrder } = useOrderAddMutation();
    const { mutateAsync: updateOrderMutation } = useOrderUpdateMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting || envoiEnCours.current) {
            return;
        }

        // 0. Le coupon d'abord, avant tout effet de bord (enregistrement du
        // client) : un code saisi mais non vérifié bloque l'envoi.
        const envoiCoupon = coupon.pourEnvoi();
        if (envoiCoupon.ok === false) {
            toast.error(envoiCoupon.message);
            return;
        }

        envoiEnCours.current = true;
        setIsSubmitting(true);

        try {
            // Données réellement envoyées. `formData` est la valeur de ce rendu :
            // l'identifiant d'un client enregistré ci-dessous n'y serait pas, et
            // la commande partirait sans client ou avec le client précédent.
            let donnees: OrderFormData = formData;

            // 1. Si le client doit être enregistré, l'enregistrer d'abord
            if (customerNeedsSave) {
                // Appeler la fonction globale exposée par CustomerInfoSection
                const saveCustomerFn = (window as any).__saveCustomerIfNeeded;
                if (!saveCustomerFn) {
                    toast.error("Impossible d'enregistrer le client");
                    return;
                }

                const attente = toast.loading("Enregistrement du client en cours...");
                let customerId: string | null | undefined;
                try {
                    customerId = await saveCustomerFn();
                } catch {
                    return;
                } finally {
                    toast.dismiss(attente);
                }
                // Fiche invalide (message déjà affiché) : on s'arrête, sans
                // rattacher la commande à un autre client.
                if (!customerId) {
                    return;
                }

                donnees = { ...formData, customer_id: customerId };
                setFormData((prev) => ({ ...prev, customer_id: customerId }));
                setCustomerNeedsSave(false);
            }

            // 2. Validation du formulaire
            if (!validateOrderForm(donnees)) {
                return;
            }

            if (isEditMode && editOrder) {
                // Mode édition : mise à jour de la commande existante
                await updateOrderMutation({
                    id: editOrder.id,
                    data: donnees,
                });
                // Retour à la liste après mise à jour
                setSectionView("orders", "list");
            } else {
                // Mode création : le code ne vient que du dernier aperçu réussi.
                try {
                    await addOrder({ ...donnees, code_promo: envoiCoupon.code_promo });
                } catch (error) {
                    // Formulaire conservé (le toast vient de la mutation) ; la
                    // carte redemande l'aperçu pour afficher le motif exact.
                    if (envoiCoupon.code_promo) coupon.apresEchecCreation(envoiCoupon.code_promo);
                    throw error;
                }
                // Réinitialiser le formulaire
                setFormData(formulaireVide(user.id));
                coupon.reinitialiser();
            }

            setCustomerNeedsSave(false);
        } catch (error) {

        } finally {
            envoiEnCours.current = false;
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isEditMode) {
            // En mode édition, retour à la liste sans confirmation
            setSectionView("orders", "list");
            return;
        }

        if (
            confirm(
                "Êtes-vous sûr de vouloir annuler ? Toutes les données seront perdues."
            )
        ) {
            setFormData(formulaireVide(user.id));
            coupon.reinitialiser();
        }
    };

    return {
        formData,
        setFormData,
        restaurants: mapToValueLabel(restaurants?.data, 'id', 'name'),
        isLoadingRestaurants,
        isSubmitting,
        setIsSubmitting,
        handleSubmit,
        handleCancel,
        handleCustomerChange,
        coupon,
    };
};
