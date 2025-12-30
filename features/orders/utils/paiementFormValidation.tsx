import { toast } from "react-hot-toast";
import { PaiementMode } from "../types/paiement.types";
import { PaiementFormData } from "../types/paiement-form.types";

export const validatePaiementForm = (
  paiements: { mode: PaiementMode; amount: number; source: string }[],
  totalToPay?: number
): boolean => {
  // 1. Vérification de l'existence de paiements
  if (!paiements || paiements.length === 0) {
    toast.error("Veuillez ajouter au moins un mode de paiement");
    return false;
  }

  // 2. Validation de l'intégrité de chaque ligne
  for (let i = 0; i < paiements.length; i++) {
    const p = paiements[i];

    if (!p.mode) {
      toast.error(`Veuillez sélectionner un mode pour le paiement #${i + 1}`);
      return false;
    }

    // On s'assure que le montant est un nombre positif et non nul
    if (typeof p.amount !== "number" || p.amount <= 0) {
      toast.error(
        `Le montant du paiement #${i + 1} doit être un nombre supérieur à 0`
      );
      return false;
    }
  }

  // 3. Validation de la couverture du montant total (si applicable)
  if (totalToPay !== undefined && totalToPay > 0) {
    const totalSaisi = paiements.reduce((sum, p) => sum + (p.amount || 0), 0);

    if (totalSaisi < totalToPay) {
      toast.error(
        `Montant insuffisant : ${totalSaisi.toLocaleString()} / ${totalToPay.toLocaleString()} FCFA`
      );
      return false;
    }
  }

  return true;
};

/**
 * Transforme le state du formulaire vers le format attendu par l'API (PaiementFormData)
 */
export const preparePaiementData = (
  paiements: { mode: PaiementMode; amount: number; source: string }[],
  orderId: string,
  clientId?: string
): PaiementFormData => {
  return {
    items: paiements.map((p) => ({
      amount: Number(p.amount),
      mode: p.mode,
      order_id: orderId,
      client_id: clientId || undefined,
      source: p.source,
    })),
  };
};
