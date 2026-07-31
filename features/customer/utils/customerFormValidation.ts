import { toast } from "react-hot-toast";
import { CustomerAddForm } from "../types/customer-form.types";

/**
 * Normalise un téléphone saisi en E.164 `+<indicatif><numéro>` — INTERNATIONAL,
 * défaut CI (décision 30/07 : plus aucune contrainte de pays).
 *
 *  - 10 chiffres commençant par 0 → saisie LOCALE ivoirienne → `+225…` ;
 *  - `00` initial → `+` ;
 *  - sinon → `+<chiffres>` tel que saisi (l'indicatif pays doit être fourni
 *    pour les numéros étrangers : +221 77 123 45 67, 00221…, 221…).
 * Retourne `null` si inexploitable (moins de 8 ou plus de 15 chiffres).
 */
export const normalizePhoneInternational = (raw: string): string | null => {
  let cleaned = (raw || "").trim();
  if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;
  const digits = cleaned.replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(digits)) return null;
  if (/^0\d{9}$/.test(digits)) return `+225${digits}`; // local CI
  return `+${digits}`;
};

export const validateCustomerForm = (formData: CustomerAddForm): boolean => {
  if (!formData.phone || formData.phone.trim() === "") {
    toast.error("Le numéro de téléphone est obligatoire.");
    return false;
  }

  // INTERNATIONAL : tout pays accepté. Le `+` n'est plus exigé — une saisie
  // locale CI (10 chiffres) est préfixée +225, un numéro étranger doit
  // simplement inclure son indicatif pays.
  if (normalizePhoneInternational(formData.phone) === null) {
    toast.error(
      "Numéro invalide. Saisissez 10 chiffres (Côte d'Ivoire) ou le numéro complet avec l'indicatif pays (ex : +221 77 123 45 67).",
    );
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
    // Toujours la forme canonique E.164 (`+…`) — même écriture que le login
    // OTP de l'app : le client backoffice et le compte app se rejoignent.
    phone: normalizePhoneInternational(formData.phone) ?? formData.phone.trim(),
    first_name: formData.first_name?.trim() || null,
    last_name: formData.last_name?.trim() || null,
    email: formData.email?.trim() || null,
  };
};
