import React, { useState } from "react";
import { IPeriode } from "../../types/analyse.type";
import { ChoixPublic } from "../commun/ChoixPublic";
import { FiltrePeriode } from "../commun/FiltrePeriode";
import { CouponsResume } from "./CouponsResume";

/** Onglet Coupons (cahier §5) : cliquer un chiffre ouvre les contacts concernés. */
export function CouponsVue({ onVoir }: { onVoir: (etat: "ACTIF" | "UTILISE" | "EXPIRE") => void }) {
  const [periode, setPeriode] = useState<IPeriode>({});
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrePeriode valeur={periode} onChange={setPeriode} />
        <ChoixPublic valeur={periode.segment} onChange={(segment) => setPeriode((p) => ({ ...p, segment }))} />
      </div>
      <CouponsResume periode={periode} onVoir={onVoir} />
      <p className="text-xs text-gray-500">
        Un coupon est un code promo à usage unique. Dès qu&apos;une commande l&apos;utilise, en caisse ou dans
        l&apos;application, elle se rattache seule au contact.
      </p>
    </div>
  );
}
