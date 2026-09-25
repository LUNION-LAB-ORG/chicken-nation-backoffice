import React, { useState } from "react";
import { IPeriode } from "../../types/analyse.type";
import { ChoixPublics } from "../commun/ChoixPublics";
import { FiltrePeriode } from "../commun/FiltrePeriode";
import { CouponsResume } from "./CouponsResume";

/**
 * Onglet Coupons : cliquer un chiffre ouvre les contacts concernés (sans
 * `onVoir`, pour qui ne voit pas la liste, les chiffres ne se cliquent pas).
 * Avec plusieurs publics, un tableau par public.
 */
export function CouponsVue({ onVoir }: { onVoir?: (etat: "ACTIF" | "UTILISE" | "EXPIRE") => void }) {
  const [periode, setPeriode] = useState<IPeriode>({});
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrePeriode valeur={periode} onChange={setPeriode} />
        <ChoixPublics valeur={periode.segments} onChange={(segments) => setPeriode((p) => ({ ...p, segments }))} />
      </div>
      <CouponsResume periode={periode} onVoir={onVoir} parPublic={(periode.segments?.length ?? 0) !== 1} />
      <p className="text-xs text-gray-500">
        Un coupon est un code promo à usage unique. Dès qu&apos;une commande l&apos;utilise, en caisse ou dans
        l&apos;application, elle se rattache seule au contact. Un coupon passé sur une commande annulée ne compte pas comme
        utilisé.
      </p>
    </div>
  );
}
