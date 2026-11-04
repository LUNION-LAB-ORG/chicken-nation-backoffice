import { EtatFilleul, EtatParrain, ReferralEarningStatus, TriParrain } from "../types/referral.types";

/** Liste à ouvrir, avec son filtre de départ. */
export type VueListe =
  | { onglet: "parrains"; etat?: EtatParrain; tri?: TriParrain }
  | { onglet: "filleuls"; etat?: EtatFilleul }
  | { onglet: "gains"; statut?: ReferralEarningStatus };
