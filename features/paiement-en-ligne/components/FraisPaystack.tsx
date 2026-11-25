"use client";

import React, { useEffect, useState } from "react";
import { Percent } from "lucide-react";
import { useReglagesPaiementMutation } from "../queries/paiement-en-ligne.query";
import type { FraisPaystack as Frais } from "../types/paiement-en-ligne.types";
import { fraisPourLeClient, lireTauxSaisi } from "../utils/paiement-en-ligne";

const CHAMPS: { cle: keyof Frais; libelle: string; aide: string }[] = [
  { cle: "mobile_money", libelle: "Mobile Money", aide: "Wave, Orange Money, MTN" },
  { cle: "carte", libelle: "Carte bancaire", aide: "Locale ou internationale" },
  { cle: "supplement", libelle: "Supplément", aide: "Ajouté aux deux taux" },
];
const EXEMPLE = 10000;
const enTexte = (n: number) => String(n).replace(".", ",");
const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/\s/g, " ")} F`;

/**
 * Frais ajoutés au client avec Paystack (25/11). Paystack n'ajoute rien au
 * montant : le client paie la commande plus le taux du moyen choisi et le
 * supplément. Le compte principal ne peut pas garder plus que le supplément.
 */
export default function FraisPaystack({ frais }: { frais: Frais }) {
  const { mutate: enregistrer, isPending } = useReglagesPaiementMutation();
  const [saisie, setSaisie] = useState<Record<keyof Frais, string>>({
    mobile_money: enTexte(frais.mobile_money),
    carte: enTexte(frais.carte),
    supplement: enTexte(frais.supplement),
  });
  useEffect(() => {
    setSaisie({ mobile_money: enTexte(frais.mobile_money), carte: enTexte(frais.carte), supplement: enTexte(frais.supplement) });
  }, [frais.mobile_money, frais.carte, frais.supplement]);

  const lus = {
    mobile_money: lireTauxSaisi(saisie.mobile_money),
    carte: lireTauxSaisi(saisie.carte),
    supplement: lireTauxSaisi(saisie.supplement),
  };
  const valide = lus.mobile_money !== null && lus.carte !== null && lus.supplement !== null;
  const change =
    valide && (lus.mobile_money !== frais.mobile_money || lus.carte !== frais.carte || lus.supplement !== frais.supplement);
  const exemple = (taux: number | null) =>
    taux === null || lus.supplement === null ? null : EXEMPLE + fraisPourLeClient(EXEMPLE, taux, lus.supplement);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Percent size={15} className="text-[#F17922]" />
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frais ajoutés au client</p>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Le client paie sa commande plus les frais du moyen qu&apos;il choisit. Il choisit Mobile Money ou carte avant de payer.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHAMPS.map((c) => (
          <div key={c.cle}>
            <label htmlFor={`frais-${c.cle}`} className="block text-sm font-medium text-gray-700 mb-1.5">
              {c.libelle}
            </label>
            <div className="relative">
              <input
                id={`frais-${c.cle}`}
                type="text"
                inputMode="decimal"
                value={saisie[c.cle]}
                onChange={(e) => setSaisie({ ...saisie, [c.cle]: e.target.value })}
                className={`w-full border rounded-lg pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                  lus[c.cle] === null ? "border-red-300" : "border-gray-300"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{c.aide}</p>
          </div>
        ))}
      </div>
      {!valide && <p className="text-sm text-red-600 mt-2">Un pourcentage entre 0 et 20.</p>}
      <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-gray-700">
          Pour une commande de {fcfa(EXEMPLE)} : Mobile Money{" "}
          <strong>{exemple(lus.mobile_money) === null ? "?" : fcfa(exemple(lus.mobile_money) as number)}</strong>, carte{" "}
          <strong>{exemple(lus.carte) === null ? "?" : fcfa(exemple(lus.carte) as number)}</strong>.
        </p>
        <button
          type="button"
          disabled={!change || isPending}
          onClick={() =>
            enregistrer({
              frais: { mobile_money: lus.mobile_money as number, carte: lus.carte as number, supplement: lus.supplement as number },
            })
          }
          className="shrink-0 px-5 py-2 bg-[#F17922] text-blanc text-sm font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Enregistrement..." : "Enregistrer les frais"}
        </button>
      </div>
    </div>
  );
}
