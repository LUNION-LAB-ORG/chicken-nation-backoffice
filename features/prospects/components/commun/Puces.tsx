import React from "react";
import { EtatCoupon, ProspectStatut } from "../../types/prospect.type";
import { CampagneStatut } from "../../types/campagne.type";
import { CAMPAGNE_META, ETAT_COUPON_META, STATUT_META } from "../../utils/prospect-ui";

export function Puce({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}

export const PuceStatut = ({ statut }: { statut: ProspectStatut }) => <Puce {...STATUT_META[statut]} />;

export const PuceCoupon = ({ etat }: { etat: EtatCoupon | "AUCUN" }) => <Puce {...ETAT_COUPON_META[etat]} />;

export const PuceCampagne = ({ statut }: { statut: CampagneStatut }) => <Puce {...CAMPAGNE_META[statut]} />;
