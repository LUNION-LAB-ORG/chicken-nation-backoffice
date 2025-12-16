import { useAuthStore } from '@/store/authStore';
import { useState } from "react";
import { toast } from "react-hot-toast";
import { mapToValueLabel } from "../../../utils/list/mapToValueLabel";
import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";
import { useOrderAddMutation } from "../queries/order-add.mutation";
import { OrderFormData } from "../types/order-form.types";
import { OrderType } from "../types/order.types";
import { validateOrderForm } from "../utils/orderFormValidation";

export const useOrderForm = () => {
    const { user } = useAuthStore();

    const [formData, setFormData] = useState<OrderFormData>({
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
    });
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

    // Mutation de création de commande
    const { mutateAsync: addOrder } = useOrderAddMutation()
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

            setCustomerNeedsSave(false);
        } catch (error) {

        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
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