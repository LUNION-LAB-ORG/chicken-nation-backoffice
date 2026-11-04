"use client";

import React from "react";
import { BadgeCheck, CircleDollarSign, Clock, HandCoins, Users, UserPlus, Wallet, Wallet2 } from "lucide-react";
import { StatsFilters } from "../../statistics/filters/statistics.filters";
import { useReferralTableauQuery } from "../queries/referral.queries";
import { nombre, pluriel, tendance } from "../utils/format";
import ReferralStatCard from "./ReferralStatCard";
import { CourbeFilleuls, CourbeVentes, ParcoursFilleuls } from "./ReferralGraphiques";
import { VueListe } from "./vues";

const GrilleCartes: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
);

/**
 * Onglet « Tableau de bord » : filleuls et ventes sur la période choisie, soldes
 * à ce jour (la période ne les change pas). Chaque carte ouvre sa liste.
 */
export default function ReferralTableau({
  filtres,
  onVoir,
}: {
  filtres: StatsFilters;
  onVoir: (vue: VueListe) => void;
}) {
  const { data, isLoading, isError, error, isPlaceholderData } = useReferralTableauQuery(filtres);

  return (
    <div className="space-y-4">
      {isError ? (
        <p className="py-8 text-center text-sm text-red-500">
          {(error as Error)?.message ?? "Les chiffres n'ont pas pu être chargés."}
        </p>
      ) : isLoading || !data ? (
        <GrilleCartes>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 h-32 animate-pulse" />
          ))}
        </GrilleCartes>
      ) : (
        <div className={`space-y-4 transition-opacity ${isPlaceholderData ? "opacity-50" : ""}`}>
          <GrilleCartes>
            <ReferralStatCard
              titre="Ambassadeurs"
              couleur="#F17922"
              Icone={Users}
              valeur={nombre(data.parrains.actifs)}
              detail={`avec un filleul, sur ${pluriel(data.parrains.codes, "code")}`}
              onClick={() => onVoir({ onglet: "parrains", etat: "avec_filleuls" })}
            />
            <ReferralStatCard
              titre="Filleuls inscrits"
              couleur="#8B5CF6"
              Icone={UserPlus}
              valeur={nombre(data.filleuls.inscrits)}
              detail={data.precedent ? undefined : "depuis le début"}
              evolution={tendance(data.filleuls.inscrits, data.precedent?.inscrits)}
              onClick={() => onVoir({ onglet: "filleuls" })}
            />
            <ReferralStatCard
              titre="Filleuls qualifiés"
              couleur="#4FCB71"
              Icone={BadgeCheck}
              valeur={nombre(data.filleuls.qualifies)}
              detail={
                data.filleuls.inscrits > 0
                  ? `${Math.round((data.filleuls.qualifies / data.filleuls.inscrits) * 100)} % des inscrits`
                  : undefined
              }
              evolution={tendance(data.filleuls.qualifies, data.precedent?.qualifies)}
              onClick={() => onVoir({ onglet: "filleuls", etat: "qualifie" })}
            />
            <ReferralStatCard
              titre="Ventes générées"
              couleur="#007AFF"
              Icone={CircleDollarSign}
              valeur={nombre(data.ventes.montant)}
              unite="FCFA"
              detail={`${pluriel(data.ventes.commandes, "commande")}${
                data.ventes.commandes > 0
                  ? ` · panier moyen ${nombre(data.ventes.montant / data.ventes.commandes)} FCFA`
                  : ""
              }`}
              evolution={tendance(data.ventes.montant, data.precedent?.ventes)}
              onClick={() => onVoir({ onglet: "parrains", tri: "ventes" })}
            />
          </GrilleCartes>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CourbeFilleuls courbe={data.courbe} />
            <CourbeVentes courbe={data.courbe} />
            <ParcoursFilleuls filleuls={data.filleuls} />
          </div>

          <h2 className="text-[18px] font-semibold text-[#F17922] pt-2">Soldes à ce jour</h2>
          <GrilleCartes>
            <ReferralStatCard
              titre="En attente"
              couleur="#B45309"
              Icone={Clock}
              valeur={nombre(data.soldes.en_attente)}
              unite="FCFA"
              detail={pluriel(data.soldes.parrains_en_attente, "parrain")}
              onClick={() => onVoir({ onglet: "gains", statut: "PENDING" })}
            />
            <ReferralStatCard
              titre="Payable"
              couleur="#0369A1"
              Icone={Wallet}
              valeur={nombre(data.soldes.payable)}
              unite="FCFA"
              detail={pluriel(data.soldes.parrains_payable, "parrain")}
              onClick={() => onVoir({ onglet: "gains", statut: "PAYABLE" })}
            />
            <ReferralStatCard
              titre="Déjà payé"
              couleur="#1E8E5A"
              Icone={Wallet2}
              valeur={nombre(data.soldes.paye)}
              unite="FCFA"
              detail={pluriel(data.soldes.parrains_paye, "parrain")}
              onClick={() => onVoir({ onglet: "gains", statut: "PAID" })}
            />
            <ReferralStatCard
              titre="Total gagné"
              couleur="#18181B"
              Icone={HandCoins}
              valeur={nombre(data.soldes.primes + data.soldes.commissions)}
              unite="FCFA"
              detail={`Primes ${nombre(data.soldes.primes)} · Commissions ${nombre(data.soldes.commissions)}`}
              onClick={() => onVoir({ onglet: "gains" })}
            />
          </GrilleCartes>
        </div>
      )}
    </div>
  );
}
