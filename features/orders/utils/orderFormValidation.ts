import { toast } from "react-hot-toast";
import { OrderFormData } from "../types/order-form.types";
import { OrderType } from "../types/order.types";

export const validateOrderForm = (formData: OrderFormData): boolean => {
  // Validation du restaurant
  if (formData.type !== OrderType.DELIVERY && !formData.restaurant_id || formData.restaurant_id.trim() === "") {
    toast.error("Veuillez sélectionner un restaurant");
    return false;
  }

  // Validation de l'adresse
  if (formData.type == OrderType.DELIVERY && !formData.address || formData.address.trim() === "") {
    toast.error("L'adresse est obligatoire");
    return false;
  }

  // Validation des articles
  if (!formData.items || formData.items.length === 0) {
    toast.error("Veuillez ajouter au moins un article à la commande");
    return false;
  }

  // Validation de chaque article
  for (let i = 0; i < formData.items.length; i++) {
    const item = formData.items[i];

    if (!item.dish_id || item.dish_id.trim() === "") {
      toast.error(`Veuillez sélectionner un plat pour l'article #${i + 1}`);
      return false;
    }

    if (!item.quantity || item.quantity < 1) {
      toast.error(`La quantité doit être d'au moins 1 pour l'article #${i + 1}`);
      return false;
    }
  }


  // Validation du téléphone si fourni
  if (formData.phone && formData.phone.trim() !== "") {
    const phoneRegex = /^\+225\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      toast.error("Le numéro de téléphone doit être au format +225 XX XX XX XX XX");
      return false;
    }
  }

  // Validation de l'email si fourni
  if (formData.email && formData.email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("L'adresse email n'est pas valide");
      return false;
    }
  }

  return true;
};

export const prepareOrderData = (formData: OrderFormData): OrderFormData => {
  return {
    type: formData.type,
    address: formData.address.trim(),
    date: formData.date || undefined,
    time: formData.time || undefined,
    fullname: formData.fullname?.trim() || undefined,
    phone: formData.phone?.trim() || undefined,
    email: formData.email?.trim() || undefined,
    note: formData.note?.trim() || undefined,
    items: formData.items.map(item => ({
      dish_id: item.dish_id,
      quantity: item.quantity,
      supplements_ids: item.supplements_ids.length > 0 ? item.supplements_ids : undefined,
      epice: item.epice,
    })),
    customer_id: formData.customer_id || undefined,
    restaurant_id: formData.restaurant_id,
    auto: formData.auto,
    user_id: formData.user_id,
  };
};