import { toast } from "react-hot-toast";
import { normalizePhoneInternational } from "../../customer/utils/customerFormValidation";
import { OrderFormData } from "../types/order-form.types";
import { OrderType } from "../types/order.types";

export const validateOrderForm = (formData: OrderFormData | Partial<OrderFormData>): boolean => {
  // Validation du restaurant
  if (formData.type !== OrderType.DELIVERY && !formData.restaurant_id || formData.restaurant_id.trim() === "") {
    toast.error("Veuillez sélectionner un restaurant");
    return false;
  }

  // Validation de l'adresse
  if (formData.type === OrderType.DELIVERY && (!formData.address || formData.address.trim() === "")) {
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


  // Validation du téléphone si fourni — INTERNATIONAL (décision 30/07 : plus
  // aucune contrainte de pays). Saisie locale CI (10 chiffres) acceptée,
  // numéro étranger accepté avec son indicatif (+221…, 00221…, 221…).
  if (formData.phone && formData.phone.trim() !== "") {
    if (normalizePhoneInternational(formData.phone) === null) {
      toast.error(
        "Numéro invalide. Saisissez 10 chiffres (Côte d'Ivoire) ou le numéro complet avec l'indicatif pays (ex : +221 77 123 45 67).",
      );
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

export const prepareOrderData = (formData: OrderFormData | Partial<OrderFormData>): OrderFormData => {
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
      supplements: item.supplements.length > 0 ? item.supplements : undefined,
      epice: item.epice,
      // Vide devient `undefined`, JAMAIS `[]`. En modification, le serveur teste
      // la présence de ce champ pour décider s'il reconduit les choix déjà
      // payés : un tableau vide passerait pour « aucun choix transmis » et
      // effacerait la composition.
      option_item_ids: item.option_item_ids?.length ? item.option_item_ids : undefined,
    })),
    customer_id: formData.customer_id || undefined,
    restaurant_id: formData.restaurant_id,
    auto: formData.auto,
    user_id: formData.user_id,
    delivery_fee: formData.delivery_fee,
    delivery_service: formData.delivery_service,
  };
};