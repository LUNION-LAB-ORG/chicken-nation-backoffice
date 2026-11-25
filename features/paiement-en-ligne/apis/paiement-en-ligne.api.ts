import { api } from "@/services/api";
import type {
  ConfigurationPaiementEnLigne,
  ReglagesPaiementEnLigneDTO,
  SousComptePaystack,
} from "../types/paiement-en-ligne.types";

/**
 * Paiement en ligne (25/11) : interrupteur, prestataire (KKiaPay ou
 * Paystack) et sous-compte Paystack de chaque restaurant. Réglages réservés
 * aux administrateurs (permission Paramètres) : le serveur tranche.
 */
export const paiementEnLigneAPI = {
  /** État complet ; `relire` relit les sous-comptes chez Paystack sans cache. */
  configuration: (relire = false) =>
    api.get<ConfigurationPaiementEnLigne>(`/paystack/configuration${relire ? "?relire=1" : ""}`),

  /** Sous-comptes du compte Paystack, pour les relier aux restaurants. */
  sousComptes: () => api.get<SousComptePaystack[]>("/paystack/sous-comptes"),

  /** Relie (ou délie avec null) le sous-compte d'un restaurant ; refusé s'il laisse une part au compte principal. */
  relier: (restaurantId: string, code: string | null) =>
    api.put<{ id: string; sous_compte: SousComptePaystack | null }>(`/paystack/restaurants/${restaurantId}/sous-compte`, { code }),

  reglages: (dto: ReglagesPaiementEnLigneDTO) => api.put<{ actif: boolean; fournisseur: string }>("/paystack/reglages", dto),
};
