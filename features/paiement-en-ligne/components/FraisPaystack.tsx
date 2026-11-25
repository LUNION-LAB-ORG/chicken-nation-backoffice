"use client";

import React, { useEffect, useState } from "react";
import { Percent } from "lucide-react";
import { useReglagesPaiementMutation } from "../queries/paiement-en-ligne.query";
import type { FraisPaystack as Frais } from "../types/paiement-en-ligne.types";
import { fraisDeService, fraisPourLeClient, lireTauxSaisi } from "../utils/paiement-en-ligne";

type Cle = "mobile_money" | "carte" | "frais_service";
const CHAMPS: { cle: Cle; libelle: string; aide: string }[] = [
  { cle: "mobile_money", libelle: "Frais Mobile Money", aide: "Wave, Orange Money, MTN" },
  { cle: "carte", libelle: "Frais carte bancaire", aide: "Locale 3,8 %, internationale 4,5 % chez Paystack" },
  { cle: "frais_service", libelle: "Frais de service", aide: "Sur le prix des plats, toutes commandes de l'appli et du site" },
];
const PLATS = 10000;
const enTexte = (n: number) => String(n).replace(".", ",");
const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/\s/g, " ")} F`;

/**
 * Ce que le client paie en plus des plats (25/11) : les frais de service de
 * la commande (réglage existant, « Taux de taxe » de l'onglet Commandes), et
 * avec Paystack les frais du moyen de paiement choisi, calculés sur le total
 * de la commande. Le compte principal ne peut pas garder plus que le taux
 * des frais de service.
 */
export default function FraisPaystack({ frais, fraisService }: { frais: Frais; fraisService: number }) {
  const { mutate: enregistrer, isPending } = useReglagesPaiementMutation();
  const initial = (): Record<Cle, string> => ({
    mobile_money: enTexte(frais.mobile_money),
    carte: enTexte(frais.carte),
    frais_service: enTexte(fraisService),
  });
  const [saisie, setSaisie] = useState<Record<Cle, string>>(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setSaisie(initial()), [frais.mobile_money, frais.carte, fraisService]);

  const lus: Record<Cle, number | null> = {
    mobile_money: lireTauxSaisi(saisie.mobile_money),
    carte: lireTauxSaisi(saisie.carte),
    frais_service: lireTauxSaisi(saisie.frais_service),
  };
  const valide = lus.mobile_money !== null && lus.carte !== null && lus.frais_service !== null;
  const change =
    valide && (lus.mobile_money !== frais.mobile_money || lus.carte !== frais.carte || lus.frais_service !== fraisService);
  const service = lus.frais_service === null ? null : fraisDeService(PLATS, lus.frais_service);
  const total = (taux: number | null) =>
    taux === null || service === null ? null : PLATS + service + fraisPourLeClient(PLATS + service, taux);
  const affiche = (n: number | null) => (n === null ? "?" : fcfa(n));

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Percent size={15} className="text-[#F17922]" />
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frais payés par le client</p>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Avec Paystack, le client choisit Mobile Money ou carte avant de payer, et paie sa commande plus les frais de ce moyen.
        Le restaurant reçoit sa commande entière.
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
          Pour {fcfa(PLATS)} de plats : frais de service {affiche(service)}. Le client paie{" "}
          <strong>{affiche(total(lus.mobile_money))}</strong> en Mobile Money, <strong>{affiche(total(lus.carte))}</strong> par
          carte.
        </p>
        <button
          type="button"
          disabled={!change || isPending}
          onClick={() =>
            enregistrer({
              frais: { mobile_money: lus.mobile_money as number, carte: lus.carte as number },
              frais_service: lus.frais_service as number,
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
