import { api } from "@/services/api";
import type { ResultatRemboursement, VerificationRemboursement } from "../types/remboursement.types";

/**
 * Remboursement KKiaPay d'un paiement (12/11). Administrateur, et manager sur
 * les commandes de son restaurant : le serveur tranche.
 */
export const remboursementAPI = {
  /** Lecture seule : la transaction chez KKiaPay. */
  verifier: (paiementId: string) => api.get<VerificationRemboursement>(`/paiements/${paiementId}/remboursement`),

  /** La référence vérifiée part avec : un paiement changé entre-temps est refusé. */
  rembourser: (paiementId: string, reference: string) =>
    api.post<ResultatRemboursement>(`/paiements/${paiementId}/remboursement`, { reference }),

  /** KKiaPay l'a déjà remboursé : on l'enregistre. */
  constater: (paiementId: string, reference: string) =>
    api.post<ResultatRemboursement>(`/paiements/${paiementId}/remboursement/constater`, { reference }),
};
