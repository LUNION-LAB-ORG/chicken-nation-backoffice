import React, { useState } from "react";
import { CalendarDays, Receipt, Store, Users } from "lucide-react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useVentesQuery } from "../../queries/analyse.query";
import { useRestaurantListQuery } from "../../../restaurants/queries/restaurant-list.query";
import { IPeriode, IVentes } from "../../types/analyse.type";
import { PUBLIC_META, compter, couvreCaptes, fmtDate, fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";
import { ChampSelect } from "../commun/Champs";
import { ChoixPublics } from "../commun/ChoixPublics";
import { Chargement, Erreur } from "../commun/Etats";
import { FiltrePeriode } from "../commun/FiltrePeriode";
import { PucePublic } from "../commun/Puces";

const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const nomMois = (cle: string) => {
  const texte = MOIS.format(new Date(`${cle}-01T00:00:00.000Z`));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
};

function Tableau({ colonnes, children }: { colonnes: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase">
            {colonnes.map((c, i) => (
              <th key={c} className={`font-semibold px-5 py-2 whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const Cellule = ({ children, gauche = false }: { children: React.ReactNode; gauche?: boolean }) => (
  <td className={`px-5 py-2.5 tabular-nums ${gauche ? "text-left" : "text-right"}`}>{children}</td>
);

function ParMois({ v }: { v: IVentes }) {
  if (v.par_mois.length === 0) return <p className="text-sm text-gray-400 py-6 text-center">Aucune vente sur la période.</p>;
  const historique = v.par_mois.some((m) => m.historique > 0);
  const colonnes = ["Mois", "Public", "Ventes", "Chiffre d'affaires"];
  if (historique) colonnes.push("Historique acquisition");
  return (
    <Tableau colonnes={colonnes}>
      {v.par_mois.map((m) => (
        <tr key={`${m.mois}-${m.segment}`} className="border-t border-gray-100">
          <Cellule gauche>
            <span className="font-semibold text-gray-800">{nomMois(m.mois)}</span>
          </Cellule>
          <Cellule gauche>
            <PucePublic segment={m.segment} />
          </Cellule>
          <Cellule>{fmtNombre(m.ventes)}</Cellule>
          <Cellule>{fmtMontant(m.ca)}</Cellule>
          {historique && (
            <Cellule>
              {m.historique > 0 && (
                <span className="text-gray-500">
                  {compter(m.historique, "vente")} · {fmtMontant(m.ca_historique)}
                </span>
              )}
            </Cellule>
          )}
        </tr>
      ))}
    </Tableau>
  );
}

function CapturesParRestaurant({ v }: { v: IVentes }) {
  if (v.captures_par_restaurant.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">Aucun client Glovo/Yango relevé sur la période.</p>;
  }
  return (
    <Tableau colonnes={["Restaurant", "Commandes relevées", "Clients", "Ventes en direct", "Taux"]}>
      {v.captures_par_restaurant.map((r) => (
        <tr key={r.restaurant_id ?? "aucun"} className="border-t border-gray-100">
          <Cellule gauche>
            <span className="font-semibold text-gray-800">{r.restaurant}</span>
          </Cellule>
          <Cellule>{fmtNombre(r.captures)}</Cellule>
          <Cellule>{fmtNombre(r.personnes)}</Cellule>
          <Cellule>
            <span className="font-semibold text-emerald-700">{fmtNombre(r.ventes)}</span>
          </Cellule>
          <Cellule>{r.personnes > 0 ? fmtPct(Math.round((r.ventes / r.personnes) * 1000) / 10) : ""}</Cellule>
        </tr>
      ))}
    </Tableau>
  );
}

function Dernieres({ v, onOuvrir }: { v: IVentes; onOuvrir: (id: string) => void }) {
  if (v.dernieres.length === 0) return <p className="text-sm text-gray-400 py-6 text-center">Aucune vente sur la période.</p>;
  return (
    <Tableau colonnes={["Client", "Public", "Date", "Commande", "Restaurant", "Montant"]}>
      {v.dernieres.map((d) => (
        <tr key={d.id} onClick={() => onOuvrir(d.contact_id)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
          <Cellule gauche>
            <span className="font-semibold text-gray-800">{d.nom}</span>
            {d.source === "ACQUISITION_HISTORIQUE" && <span className="block text-xs text-gray-400">historique acquisition</span>}
          </Cellule>
          <Cellule gauche>
            <PucePublic segment={d.segment} />
          </Cellule>
          <Cellule gauche>{fmtDate(d.converted_at)}</Cellule>
          <Cellule gauche>{d.reference ?? ""}</Cellule>
          <Cellule gauche>{d.restaurant ?? ""}</Cellule>
          <Cellule>{fmtMontant(d.amount)}</Cellule>
        </tr>
      ))}
    </Tableau>
  );
}

/**
 * Onglet Ventes : les commandes qui ont fait sortir un contact du CRM. Une
 * vente par personne et par passage dans le CRM, espèces comprises ; une
 * commande ne compte qu'une fois, même quand elle concerne deux fiches (deux
 * puces). Les ventes de l'ancienne acquisition Glovo/Yango restent visibles
 * en « historique acquisition », à part des chiffres du CRM.
 */
export function Ventes({ onOuvrir }: { onOuvrir: (id: string) => void }) {
  const [periode, setPeriode] = useState<IPeriode>({});
  const [restaurantId, setRestaurantId] = useState("");
  const { data: restaurants } = useRestaurantListQuery({ limit: 100 });
  const requete = useVentesQuery({
    from: periode.from,
    to: periode.to,
    segments: periode.segments,
    restaurant_id: restaurantId || undefined,
  });
  const v = requete.data;
  // Sans Glovo ni Yango dans le filtre, il n'y a pas de captures à montrer.
  const captes = couvreCaptes(periode.segments);
  const relevees = v?.captures_total?.personnes ?? 0;
  const venduesDirect = v?.captures_total?.ventes ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrePeriode valeur={periode} onChange={setPeriode} />
        <div className="flex flex-wrap items-center gap-2">
          <ChoixPublics valeur={periode.segments} onChange={(segments) => setPeriode((p) => ({ ...p, segments }))} />
          <div className="w-full sm:w-64">
            <ChampSelect
              valeur={restaurantId}
              onChange={setRestaurantId}
              vide="Tous les restaurants"
              options={((restaurants?.data ?? []) as { id: string; name: string }[]).map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>
        </div>
      </div>

      {requete.isError ? (
        <Erreur message={(requete.error as Error)?.message} />
      ) : !v ? (
        <Chargement />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard title="Ventes" value={fmtNombre(v.total.ventes)} subtitle="clients sortis du CRM par une commande" color="green" />
            <StatsCard title="Chiffre d'affaires" value={fmtMontant(v.total.ca)} subtitle="ventes du CRM seulement" color="green" />
            <StatsCard title="Panier moyen" value={v.total.ventes > 0 ? fmtMontant(v.total.panier_moyen) : ""} />
            {captes ? (
              <StatsCard
                title="Clients Glovo/Yango relevés"
                value={fmtNombre(relevees)}
                subtitle={`${compter(venduesDirect, "vente")} en direct depuis la capture`}
                color="blue"
              />
            ) : (
              v.total.historique > 0 && (
                <StatsCard
                  title="Historique acquisition"
                  value={fmtNombre(v.total.historique)}
                  subtitle={`${fmtMontant(v.total.ca_historique)}, hors chiffres du CRM`}
                  color="purple"
                />
              )
            )}
          </div>
          {captes && v.total.historique > 0 && (
            <p className="text-xs text-gray-500">
              À part, hors chiffres du CRM : {compter(v.total.historique, "vente")} de l&apos;ancienne acquisition Glovo/Yango,{" "}
              {fmtMontant(v.total.ca_historique)}.
            </p>
          )}

          {v.par_public.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {v.par_public.map((p) => (
                <div key={p.segment} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <PucePublic segment={p.segment} />
                  <p className="text-xl font-bold text-gray-900 tabular-nums mt-2">{compter(p.ventes, "vente")}</p>
                  <p className="text-xs text-gray-500">{fmtMontant(p.ca)}</p>
                  {p.historique > 0 && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      historique acquisition : {compter(p.historique, "vente")}, {fmtMontant(p.ca_historique)}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">{PUBLIC_META[p.segment].label}</p>
                </div>
              ))}
            </div>
          )}

          <div className={`grid gap-4 ${captes ? "xl:grid-cols-2" : ""}`}>
            <StatsChartCard title="Par mois" subtitle="Ventes et chiffre d'affaires, par public" icon={CalendarDays}>
              <ParMois v={v} />
            </StatsChartCard>
            {captes && (
              <StatsChartCard
                title="Clients Glovo/Yango par restaurant"
                subtitle="Relevés en caisse sur la période, et combien ont commandé en direct depuis"
                icon={Store}
              >
                <CapturesParRestaurant v={v} />
              </StatsChartCard>
            )}
          </div>

          <StatsChartCard title="Dernières ventes" subtitle="Les 100 plus récentes : cliquez pour ouvrir la fiche" icon={Receipt}>
            <Dernieres v={v} onOuvrir={onOuvrir} />
          </StatsChartCard>

          <p className="flex items-start gap-2 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Une vente par client et par passage dans le CRM, espèces comprises ; une commande ne compte qu&apos;une fois, même si le
              client a deux numéros. Une commande annulée sort des chiffres.
              {v.bascule &&
                ` Les ventes antérieures au ${fmtDate(v.bascule)} viennent de l'ancienne acquisition Glovo/Yango : elles restent à part, hors ventes et hors chiffre d'affaires du CRM.`}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
