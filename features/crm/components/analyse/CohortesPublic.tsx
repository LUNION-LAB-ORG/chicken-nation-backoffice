import React, { useState } from "react";
import { CalendarRange } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useCohortesQuery } from "../../queries/analyse.query";
import { ICohortePublic, ICohortesCaptes, ICohortesInactifs, ICohortesInscrits, IPeriode } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { PUBLIC_META, fmtJours, fmtNombre, fmtPct, publicsCouverts } from "../../utils/crm-ui";
import { EtatRequete } from "../commun/Etats";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const libelleMois = (m: string) => `${MOIS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

/** Intensité de fond selon le taux : la cohorte qui convertit le mieux saute aux yeux. */
const fond = (taux: number, max: number) => `rgba(22, 163, 74, ${max > 0 ? 0.08 + (taux / max) * 0.35 : 0})`;
const pct = (n: number, sur: number) => (sur > 0 ? fmtPct(Math.round((n / sur) * 1000) / 10) : "");

function Entete({ colonnes }: { colonnes: string[] }) {
  return (
    <thead className="sticky top-0 bg-white">
      <tr className="text-gray-500 text-xs uppercase">
        {colonnes.map((c, i) => (
          <th key={c} className={`font-semibold px-4 py-2 whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

const Td = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <td className={`px-4 py-2 text-right tabular-nums whitespace-nowrap ${className}`} style={style}>
    {children}
  </td>
);

const Mois = ({ m }: { m: string }) => <td className="px-4 py-2 font-semibold text-gray-800 whitespace-nowrap">{libelleMois(m)}</td>;

/** Ventes à 30, 60 ou 90 jours : « en cours » tant que tous les entrés du mois n'ont pas eu ce délai en entier. */
function Palier({ n, sur, complet }: { n: number; sur: number; complet: boolean }) {
  return (
    <Td>
      {fmtNombre(n)} <span className="text-xs text-gray-400">{complet ? pct(n, sur) : "en cours"}</span>
    </Td>
  );
}

function TableInscrits({ c }: { c: ICohortesInscrits }) {
  const max = Math.max(0, ...c.lignes.map((l) => l.taux));
  return (
    <table className="w-full text-sm">
      <Entete colonnes={["Mois", "Inscrits", "Ont commandé", "Taux", "Sous 7 jours", "Délai moyen", "Délai médian"]} />
      <tbody>
        {[...c.lignes].reverse().map((l) => (
          <tr key={l.mois} className="border-t border-gray-100">
            <Mois m={l.mois} />
            <Td>{fmtNombre(l.inscrits)}</Td>
            <Td>{fmtNombre(l.convertis)}</Td>
            <Td className="font-semibold" style={{ backgroundColor: fond(l.taux, max) }}>
              {fmtPct(l.taux)}
            </Td>
            <Td>{fmtPct(l.taux_7_jours)}</Td>
            <Td>{l.convertis > 0 ? fmtJours(l.delai_moyen) : ""}</Td>
            <Td>{l.convertis > 0 ? fmtJours(l.delai_median) : ""}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableInactifs({ c }: { c: ICohortesInactifs }) {
  const max = Math.max(0, ...c.lignes.map((l) => l.taux));
  return (
    <table className="w-full text-sm">
      <Entete
        colonnes={["Mois", "Devenus inactifs", "Reconquis", "Taux", "À 30 jours", "À 60 jours", "À 90 jours", "Délai médian", "Encore ouverts", "Déjà reconquis avant"]}
      />
      <tbody>
        {[...c.lignes].reverse().map((l) => (
          <tr key={l.mois} className="border-t border-gray-100">
            <Mois m={l.mois} />
            <Td>{fmtNombre(l.entres)}</Td>
            <Td>{fmtNombre(l.reconquis)}</Td>
            <Td className="font-semibold" style={{ backgroundColor: fond(l.taux, max) }}>
              {fmtPct(l.taux)}
            </Td>
            <Palier n={l.reconquis_30j} sur={l.entres} complet={l.complet_30j} />
            <Palier n={l.reconquis_60j} sur={l.entres} complet={l.complet_60j} />
            <Palier n={l.reconquis_90j} sur={l.entres} complet={l.complet_90j} />
            <Td>{fmtJours(l.delai_median_j)}</Td>
            <Td>{fmtNombre(l.encore_ouverts)}</Td>
            <Td>{fmtNombre(l.deja_reconquis_avant)}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableCaptes({ c }: { c: ICohortesCaptes }) {
  const max = Math.max(0, ...c.lignes.map((l) => l.taux));
  return (
    <table className="w-full text-sm">
      <Entete
        colonnes={[
          "Mois",
          "Captés",
          "Déjà clients",
          "Sans compte",
          "Déjà inscrits",
          "Inscrits depuis",
          "Commandes directes",
          "Taux",
          "À 30 jours",
          "À 60 jours",
          "À 90 jours",
          "Délai d'inscription",
          "Délai de commande",
          "Ventes déjà clients",
        ]}
      />
      <tbody>
        {[...c.lignes].reverse().map((l) => {
          const base = l.captes - l.deja_clients - (l.historiques ?? 0);
          return (
            <tr key={l.mois} className="border-t border-gray-100">
              <Mois m={l.mois} />
              <Td>{fmtNombre(l.captes)}</Td>
              <Td className="text-gray-500">{fmtNombre(l.deja_clients)}</Td>
              <Td>{fmtNombre(l.sans_compte)}</Td>
              <Td>{fmtNombre(l.deja_inscrits_a_la_capture)}</Td>
              <Td>{fmtNombre(l.inscrits_apres_capture)}</Td>
              <Td>{fmtNombre(l.commandes_directes)}</Td>
              <Td className="font-semibold" style={{ backgroundColor: fond(l.taux, max) }}>
                {fmtPct(l.taux)}
              </Td>
              <Palier n={l.commandes_directes_30j} sur={base} complet={l.complet_30j} />
              <Palier n={l.commandes_directes_60j} sur={base} complet={l.complet_60j} />
              <Palier n={l.commandes_directes_90j} sur={base} complet={l.complet_90j} />
              <Td>{fmtJours(l.delai_median_inscription_j)}</Td>
              <Td>{fmtJours(l.delai_median_commande_j)}</Td>
              <Td className="text-gray-500">{fmtNombre(l.commandes_deja_clients)}</Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Sans ligne pour un point de vente : les inscrits n'appartiennent à aucun restaurant. */
const horsRestaurant = (c: ICohortePublic) => c.type === "INSCRITS" && !!c.hors_restaurant;

function Contenu({ c }: { c: ICohortePublic }) {
  if (horsRestaurant(c)) {
    return <p className="text-sm text-gray-500 py-6 px-5 text-center">Les inscrits qui n&apos;ont jamais commandé ne sont rattachés à aucun restaurant.</p>;
  }
  if (c.lignes.length === 0) return <p className="text-sm text-gray-400 py-6 text-center">Aucune cohorte sur cette période.</p>;
  if (c.type === "INACTIFS") return <TableInactifs c={c} />;
  if (c.type === "CAPTES") return <TableCaptes c={c} />;
  return <TableInscrits c={c} />;
}

const AIDE: Record<ICohortePublic["type"], string> = {
  INSCRITS: "Tous les clients de l'appli par mois d'inscription, ceux d'avant le CRM compris. Une commande annulée ne compte pas.",
  INACTIFS:
    "Passages par mois de décrochage. « En cours » : tous les clients du mois n'ont pas encore eu ce délai en entier. « Déjà reconquis avant » : clients déjà sortis une fois de la liste par une commande.",
  CAPTES:
    "Passages par mois de capture. Les déjà clients de l'appli et les clients déjà convertis par l'ancienne acquisition sont hors taux. « En cours » : tous les captés du mois n'ont pas encore eu ce délai en entier.",
};

/**
 * Cohortes propres à chaque public : inscrits par mois d'inscription,
 * inactifs par mois de décrochage, Glovo/Yango par mois de capture. Avec
 * plusieurs publics, un onglet par public. Les mois entiers qui touchent la
 * période sont retenus ; le filtre campagne ne s'applique pas.
 */
export function CohortesPublic({ periode }: { periode: IPeriode }) {
  const publics = publicsCouverts(periode.segments);
  const [choisi, setChoisi] = useState<Public>(publics[0]);
  const onglet = publics.includes(choisi) ? choisi : publics[0];
  const requete = useCohortesQuery({ segment: onglet, from: periode.from, to: periode.to });
  const c = requete.data;

  return (
    <StatsChartCard
      title={`Cohortes ${PUBLIC_META[onglet].cohorte}`}
      subtitle={
        periode.from
          ? "Mois entiers de la période"
          : periode.to
            ? `Tous les mois jusqu'à ${libelleMois(periode.to)} inclus`
            : "Tous les mois"
      }
      icon={CalendarRange}
    >
      {publics.length > 1 && (
        <div className="w-full overflow-x-auto mb-3">
          <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-xl p-1 w-fit min-w-max" role="tablist">
            {publics.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={p === onglet}
                onClick={() => setChoisi(p)}
                className={`text-[13px] font-semibold px-3 py-1 rounded-lg whitespace-nowrap ${
                  p === onglet ? "bg-white text-[#F17922] shadow-sm" : "text-[#71717A] hover:text-gray-700"
                }`}
              >
                {PUBLIC_META[p].label}
              </button>
            ))}
          </div>
        </div>
      )}
      <EtatRequete requete={requete}>
        {c && (
          <>
            <div className={`overflow-x-auto -mx-5 max-h-96 ${requete.isPlaceholderData ? "opacity-60" : ""}`}>
              <Contenu c={c} />
            </div>
            {!horsRestaurant(c) && <p className="text-xs text-gray-500 mt-3">{AIDE[c.type]}</p>}
            {periode.campaign_id && (
              <p className="text-xs text-amber-700 mt-1">
                Toute la population : le filtre campagne ne s'applique pas aux cohortes.
              </p>
            )}
          </>
        )}
      </EtatRequete>
    </StatsChartCard>
  );
}
