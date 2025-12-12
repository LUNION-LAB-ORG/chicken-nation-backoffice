import { toast } from "react-hot-toast";
import { CustomerAddForm } from "../types/customer-form.types";

export const validateCustomerForm = (formData: CustomerAddForm): boolean => {
  if (!formData.phone || formData.phone.trim() === "") {
    toast.error("Le numéro de téléphone est obligatoire.");
    return false;
  }
  // Validation du format du téléphone (Exemple : format Ivoirien +225)
  const phoneRegex = /^\+(?:[0-9] ?){6,14}[0-9]$/;

  if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
    toast.error("Le numéro de téléphone doit être au format international (+225 XX XX XX XX XX)");
    return false;
  }

  // Validation de l'email si fourni
  if (formData.email && formData.email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("L'adresse email n'est pas valide");
      return false;
    }
  }

  if (!formData.first_name && !formData.last_name) {
    toast.error("Veuillez fournir au moins un prénom ou un nom de famille.");
    return false;
  }

  return true;
};

export const prepareCustomerData = (formData: CustomerAddForm) => {
  return {
    phone: formData.phone.trim(),
    first_name: formData.first_name?.trim() || null,
    last_name: formData.last_name?.trim() || null,
    email: formData.email?.trim() || null,
  };
};