import React from "react";
import { EtatCoupon, ContactStatut, Public } from "../../types/contact.type";
import { CampagneStatut } from "../../types/campagne.type";
import { CAMPAGNE_META, ETAT_COUPON_META, PUBLIC_META, STATUT_META, libelleStatut } from "../../utils/crm-ui";

export function Puce({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}

export const PuceStatut = ({ statut, segment }: { statut: ContactStatut; segment?: Public }) => (
  <Puce label={libelleStatut(statut, segment)} className={STATUT_META[statut].className} />
);

export const PucePublic = ({ segment }: { segment: Public }) => (
  <Puce label={PUBLIC_META[segment].court} className={PUBLIC_META[segment].className} />
);

export const PuceCoupon = ({ etat }: { etat: EtatCoupon | "AUCUN" }) => <Puce {...ETAT_COUPON_META[etat]} />;

export const PuceCampagne = ({ statut }: { statut: CampagneStatut }) => <Puce {...CAMPAGNE_META[statut]} />;
