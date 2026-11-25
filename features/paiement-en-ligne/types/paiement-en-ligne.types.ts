/** Prestataire du paiement en ligne (appli et site). */
export type Fournisseur = "kkiapay" | "paystack";

/** Sous-compte Paystack, tel que le serveur le lit chez Paystack. */
export interface SousComptePaystack {
  code: string;
  nom: string | null;
  banque: string | null;
  /** Numéro masqué : seuls les 4 derniers chiffres. */
  compte: string | null;
  /** Part gardée par le compte principal, en pourcentage : doit valoir 0. */
  partComptePrincipal: number | null;
  actif: boolean;
  devise: string | null;
  utilisable?: boolean;
  motif?: string | null;
}

export interface RestaurantPaystack {
  id: string;
  nom: string;
  sous_compte: (Partial<SousComptePaystack> & { code: string }) | null;
  utilisable: boolean;
  motif: string | null;
}

export interface ConfigurationPaiementEnLigne {
  en_ligne_actif: boolean;
  fournisseur: Fournisseur;
  paystack: {
    cle_configuree: boolean;
    mode: "test" | "live" | null;
    secret_webhook_configure: boolean;
    webhook_path: string;
  };
  restaurants: RestaurantPaystack[];
}

export interface ReglagesPaiementEnLigneDTO {
  en_ligne_actif?: boolean;
  fournisseur?: Fournisseur;
}
