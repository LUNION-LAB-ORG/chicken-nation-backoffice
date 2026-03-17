import { useAuthStore } from '../../users/hook/authStore';
import { useMemo, useState } from "react";
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
            epice: item.epice,
        })),
        customer_id: order.customerId || "",
        restaurant_id: order.restaurantId || "",
        auto: order.auto,
        user_id: userId,
        delivery_fee: order.deliveryFee || 0,
    };
};

export const useOrderForm = (editOrder?: OrderTable) => {
    const { user } = useAuthStore();
    const { setSectionView } = useDashboardStore();
    const isEditMode = !!editOrder;

    const initialFormData = useMemo(() => {
        if (editOrder) {
            return buildFormDataFromOrder(editOrder, user.id);
        }
        return {
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
            user_id: user.id,
            delivery_fee: 0,
        } as OrderFormData;
    }, [editOrder, user.id]);

    const [formData, setFormData] = useState<OrderFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        }
    };

    // Mutations
    const { mutateAsync: addOrder } = useOrderAddMutation();
    const { mutateAsync: updateOrderMutation } = useOrderUpdateMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Si le client doit être enregistré, l'enregistrer d'abord
            if (customerNeedsSave) {
                toast.loading("Enregistrement du client en cours...");

                // Appeler la fonction globale exposée par CustomerInfoSection
                const saveCustomerFn = (window as any).__saveCustomerIfNeeded;
                if (saveCustomerFn) {
                    try {
                        const customerId = await saveCustomerFn();
                        if (customerId) {
                            setFormData((prev) => ({ ...prev, customer_id: customerId }));
                            setCustomerNeedsSave(false);
                        }
                    } catch (error) {
                        setIsSubmitting(false);
                        return;
                    }
                } else {
                    toast.error("Impossible d'enregistrer le client");
                    setIsSubmitting(false);
                    return;
                }
            }

            // 2. Validation du formulaire
            if (!validateOrderForm(formData)) {
                setIsSubmitting(false);
                return;
            }

            if (isEditMode && editOrder) {
                // Mode édition : mise à jour de la commande existante
                await updateOrderMutation({
                    id: editOrder.id,
                    data: formData,
                });
                // Retour à la liste après mise à jour
                setSectionView("orders", "list");
            } else {
                // Mode création : nouvelle commande
                await addOrder(formData);
                // Réinitialiser le formulaire
                setFormData({
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
                    user_id: user.id,
                    delivery_fee: 0
                });
            }

            setCustomerNeedsSave(false);
        } catch (error) {

        } finally {
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
            setFormData({
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
                user_id: user.id,
                delivery_fee: 0

            });
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
    };
};
