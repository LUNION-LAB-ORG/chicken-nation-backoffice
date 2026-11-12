import type { PaiementStatus } from "./paiement.types";

/** Réponse de GET /paiements/:id/remboursement : ce que dit KKiaPay, et ce qui est permis. */
export interface VerificationRemboursement {
  paiement: {
    id: string;
    reference: string;
    montant: number;
    frais: number;
    total: number;
    moyen: string | null;
    date: string;
    statut: PaiementStatus;
    rembourse_at: string | null;
    rembourse_par: string | null;
  };
  commande: { id: string; reference: string } | null;
  kkiapay: {
    statut: string;
    libelle: string;
    montant: number | null;
    frais: number | null;
    moyen: string | null;
    date: string | null;
  } | null;
  compte: string;
  remboursable: boolean;
  constatable: boolean;
  raison: string | null;
}

export interface ResultatRemboursement {
  message: string;
  paiement: { id: string; status: PaiementStatus; rembourse_at: string | null; rembourse_par_nom: string | null };
  commande_payee: boolean | null;
}
