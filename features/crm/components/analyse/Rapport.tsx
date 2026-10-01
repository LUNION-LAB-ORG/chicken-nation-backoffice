"use client";

import React, { useState } from "react";
import { FileDown, Loader2, Store } from "lucide-react";
import { toast } from "react-hot-toast";
import { analyseAPI } from "../../apis/analyse.api";
import { usePointDeVente } from "../../hooks/useDroitsCrm";
import { useRapportQuery } from "../../queries/analyse.query";
import { useCampagnesQuery } from "../../queries/campagne.query";
import { IPeriode, IRapport } from "../../types/analyse.type";
import { ICampagne } from "../../types/campagne.type";
import { Public } from "../../types/contact.type";
import {
  COULEUR_PUBLIC,
  PUBLIC_META,
  accord,
  compter,
  fmtJours,
  fmtMontant,
  fmtNombre,
  fmtPct,
  publicsCouverts,
} from "../../utils/crm-ui";
import { BarresRepartition } from "../commun/BarresRepartition";
import { ChampSelect } from "../commun/Champs";
import { ChoixPublics } from "../commun/ChoixPublics";
import { EtatRequete, Vide } from "../commun/Etats";
import { FiltrePeriode } from "../commun/FiltrePeriode";
import { Puce } from "../commun/Puces";
import { CarteTaux, Chiffre, GrilleChiffres, Repere } from "./rapport/Chiffres";
import { CourbeInscriptions } from "./rapport/CourbeInscriptions";
import { EntonnoirBarres, etapesLevier } from "./rapport/EntonnoirBarres";
import { Section, SectionHorsFiltre, Tableau } from "./rapport/Section";

const ORANGE = "#F17922";
const jj = (v: string) => v.split("-").reverse().join("/");

/** Une campagne compte pour le filtre si elle vise au moins un des publics choisis (tous : toutes). */
const visePublics = (c: ICampagne, publics: Public[]) =>
  publics.length === 0 || (c.segments ?? []).some((s) => publics.includes(s));

/** Mêmes mots que `libellePrecedente` du serveur (PDF) : « à la veille », « à la semaine précédente », « au mois précédent », « aux 60 jours précédents ». */
function comparaison(jours: number): string {
  if (jours === 1) return "comparé à la veille";
  if (jours === 7) return "comparé à la semaine précédente";
  if (jours === 30 || jours === 31) return "comparé au mois précédent";
  return `comparé aux ${fmtNombre(jours)} jours précédents`;
}

/** Rien ne s'est passé sur la période : ni inscrit, ni appel, ni entrée, ni vente. */
const sansActivite = (r: IRapport) =>
  r.inscriptions.inscrits.valeur === 0 &&
  r.captes.total.entres.valeur === 0 &&
  r.inactifs.entres.valeur === 0 &&
  r.equipe.appels.valeur === 0 &&
  r.resultat.ventes.valeur === 0;

/** Pastille d'un public, à sa couleur. */
const Pastille = ({ segment }: { segment: string }) => {
  const p = segment as Public;
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COULEUR_PUBLIC[p] ?? ORANGE }} aria-hidden />
      {PUBLIC_META[p]?.court ?? segment}
    </span>
  );
};

function EnTete({ r }: { r: IRapport }) {
  const couverts = publicsCouverts(r.filtres.publics as Public[]);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#F17922] pb-4">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-gray-900">Où en sommes-nous</h2>
        <p className="mt-1 text-sm text-gray-600">
          Du <span className="font-semibold text-gray-800">{jj(r.periode.debut)}</span> au{" "}
          <span className="font-semibold text-gray-800">{jj(r.periode.fin)}</span> ({compter(r.periode.jours, "jour")}),{" "}
          {comparaison(r.periode.jours)} (du {jj(r.precedente.debut)} au {jj(r.precedente.fin)}).
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {couverts.length === 4 ? (
            <Puce label="Tous les publics" className="bg-gray-100 text-gray-600" />
          ) : (
            couverts.map((p) => <Puce key={p} label={PUBLIC_META[p].court} className={PUBLIC_META[p].className} />)
          )}
          {r.filtres.campagne && <Puce label={`Campagne : ${r.filtres.campagne.nom}`} className="bg-orange-100 text-[#C2410C]" />}
          {r.filtres.restaurant && <Puce label={r.filtres.restaurant.nom} className="bg-gray-100 text-gray-700" />}
        </div>
      </div>
      <p className="text-xs text-gray-400">Édité le {jj(r.edite_le)}</p>
    </div>
  );
}

function ARetenir({ phrases }: { phrases: string[] }) {
  if (phrases.length === 0) return null;
  return (
    <div className="rounded-2xl border border-orange-100 bg-[#FDF3E7] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C2410C]">À retenir</p>
      <ul className="mt-2 space-y-1.5">
        {phrases.map((p) => (
          <li key={p} className="flex gap-2.5 text-sm leading-snug text-gray-800">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F17922]" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Inscriptions({ i, pointDeVente }: { i: IRapport["inscriptions"]; pointDeVente: boolean }) {
  return (
    <Section
      titre="Inscriptions"
      sousTitre="Comptes clients créés sur la période, et ceux qui ont déjà passé une première commande"
      couleur={COULEUR_PUBLIC.JAMAIS_COMMANDE}
      droite={<Puce label="Inscrits" className={PUBLIC_META.JAMAIS_COMMANDE.className} />}
    >
      {i.hors_restaurant && pointDeVente && (
        <p className="flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
          <Store className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Inscrits de tout le réseau : un inscrit qui n&apos;a pas encore commandé n&apos;est rattaché à aucun restaurant.
        </p>
      )}
      <GrilleChiffres>
        <Chiffre libelle="Inscrits" c={i.inscrits} />
        <Chiffre libelle="Ont commandé" c={i.ont_commande} accent />
        <Chiffre libelle="Sous 7 jours" c={i.sous_7_jours} />
        <Chiffre libelle="Chiffre d'affaires" c={i.ca} />
        <CarteTaux libelle="Taux de commande" t={i.taux_commande} aide="ont commandé, sur les inscrits" />
        <Repere libelle="Délai médian" valeur={fmtJours(i.delai_median_j)} aide="de l'inscription à la première commande" />
        <Repere libelle="Pas encore commandé" valeur={fmtNombre(i.sans_commande)} aide={`${accord(i.sans_commande, "inscrit")} à relancer`} />
      </GrilleChiffres>
      <CourbeInscriptions serie={i.serie} pas={i.pas} />
    </Section>
  );
}

function Captes({ c }: { c: IRapport["captes"] }) {
  const t = c.total;
  // Un public exclu par le filtre reste dans la réponse, à zéro : on ne l'affiche pas.
  const lignes = c.par_public.filter((l) => !l.hors_filtre);
  const seul = lignes.length === 1 ? lignes[0] : null;
  // Le libellé du serveur est déjà complet : « Clients Glovo ».
  const titre = seul ? seul.libelle : "Clients Glovo et Yango";
  return (
    <Section
      titre={titre}
      sousTitre="Relevés en caisse sur une commande Glovo ou Yango, appelés pour commander en direct"
      couleur={seul ? COULEUR_PUBLIC[seul.segment] : COULEUR_PUBLIC.GLOVO}
      droite={
        <span className="flex gap-1">
          {lignes.map((l) => (
            <Puce key={l.segment} label={PUBLIC_META[l.segment].court} className={PUBLIC_META[l.segment].className} />
          ))}
        </span>
      }
    >
      <GrilleChiffres>
        <Chiffre libelle="Captés" c={t.entres} />
        <Chiffre libelle="Appelés" c={t.appeles} />
        <Chiffre libelle="Joints" c={t.joints} />
        <Chiffre libelle="Passés en direct" c={t.ventes} accent />
        <Chiffre libelle="Chiffre d'affaires" c={t.ca} />
        <CarteTaux libelle="Taux de contact" t={t.taux_contact} aide="joints, sur les appelés" />
        <CarteTaux libelle="Taux de passage" t={t.taux_conversion} aide="passés en direct, sur les captés" />
      </GrilleChiffres>
      {/* `grid-cols-1` borne la colonne à la largeur de la carte : sans elle, le tableau à largeur minimale élargirait la grille et couperait l'entonnoir sur téléphone. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <EntonnoirBarres titre="Du relevé en caisse à la commande directe" couleur={seul ? COULEUR_PUBLIC[seul.segment] : COULEUR_PUBLIC.GLOVO} etapes={etapesLevier(t, "Captés", "Passés en direct")} />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Par public</p>
          <Tableau
            lignes={lignes}
            cle={(l) => l.segment}
            vide="Aucun public capté sur la période."
            minLargeur={560}
            colonnes={[
              { titre: "Public", rendu: (l) => <Pastille segment={l.segment} /> },
              { titre: "Captés", droite: true, rendu: (l) => fmtNombre(l.entres.valeur) },
              { titre: "Appelés", droite: true, rendu: (l) => fmtNombre(l.appeles.valeur) },
              { titre: "Joints", droite: true, rendu: (l) => fmtNombre(l.joints.valeur) },
              { titre: "Coupons", droite: true, rendu: (l) => fmtNombre(l.coupons.valeur) },
              { titre: "En direct", droite: true, className: "font-semibold text-emerald-700", rendu: (l) => fmtNombre(l.ventes.valeur) },
              { titre: "Taux", droite: true, rendu: (l) => fmtPct(l.taux_conversion.valeur) },
              { titre: "Chiffre d'affaires", droite: true, rendu: (l) => fmtMontant(l.ca.valeur) },
            ]}
          />
        </div>
      </div>
    </Section>
  );
}

function Inactifs({ i }: { i: IRapport["inactifs"] }) {
  return (
    <Section
      titre="Clients inactifs"
      sousTitre="Ont déjà commandé, plus rien depuis le délai réglé : appelés pour revenir"
      couleur={COULEUR_PUBLIC.INACTIF}
      droite={<Puce label="Inactifs" className={PUBLIC_META.INACTIF.className} />}
    >
      <GrilleChiffres>
        <Chiffre libelle="Entrés en inactivité" c={i.entres} />
        <Chiffre libelle="Appelés" c={i.appeles} />
        <Chiffre libelle="Joints" c={i.joints} />
        <Chiffre libelle="Clients revenus" c={i.ventes} accent />
        <Chiffre libelle="Chiffre d'affaires" c={i.ca} />
        <CarteTaux libelle="Taux de contact" t={i.taux_contact} aide="joints, sur les appelés" />
        <CarteTaux libelle="Taux de retour" t={i.taux_conversion} aide="revenus, sur les entrés" />
        <Repere libelle="Délai médian" valeur={fmtJours(i.delai_median_j)} aide="de l'entrée en inactivité au retour" />
      </GrilleChiffres>
      <div className="max-w-2xl">
        <EntonnoirBarres titre="De l'inactivité au retour" couleur={COULEUR_PUBLIC.INACTIF} etapes={etapesLevier(i, "Entrés", "Clients revenus")} />
      </div>
    </Section>
  );
}

function Equipe({ e }: { e: IRapport["equipe"] }) {
  return (
    <Section titre="Effort de l'équipe" sousTitre="Appels passés, clients joints et coupons envoyés sur la période" couleur={ORANGE}>
      <GrilleChiffres>
        <Chiffre libelle="Appels" c={e.appels} />
        <Chiffre libelle="Clients joints" c={e.joints} />
        <Chiffre libelle="Coupons envoyés" c={e.coupons} />
        <CarteTaux libelle="Taux de contact" t={e.taux_contact} aide="joints, sur les appelés" />
      </GrilleChiffres>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Par agent · {compter(e.agents.length, "agent")}
        </p>
        <Tableau
          lignes={e.agents}
          cle={(a) => a.id}
          vide="Aucune activité d'agent sur la période."
          minLargeur={560}
          colonnes={[
            { titre: "Agent", className: "font-semibold text-gray-800", rendu: (a) => a.nom },
            { titre: "Appels", droite: true, rendu: (a) => fmtNombre(a.appels) },
            { titre: "Joints", droite: true, rendu: (a) => fmtNombre(a.joints) },
            { titre: "Coupons", droite: true, rendu: (a) => fmtNombre(a.coupons) },
            { titre: "Ventes", droite: true, className: "font-semibold text-emerald-700", rendu: (a) => fmtNombre(a.ventes) },
            { titre: "Chiffre d'affaires", droite: true, rendu: (a) => fmtMontant(a.ca) },
          ]}
        />
      </div>
    </Section>
  );
}

function Resultat({ r, couverts }: { r: IRapport["resultat"]; couverts: Public[] }) {
  const lignes = r.par_public.filter((l) => couverts.includes(l.segment as Public));
  return (
    <Section titre="Résultat" sousTitre="Ventes attribuées au CRM sur la période" couleur={ORANGE}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Chiffre libelle="Ventes" c={r.ventes} accent />
        <Chiffre libelle="Chiffre d'affaires" c={r.ca} />
        <Chiffre libelle="Panier moyen" c={r.panier_moyen} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Par public</p>
        <Tableau
          lignes={lignes}
          cle={(l) => l.segment}
          vide="Aucune vente sur la période."
          minLargeur={320}
          colonnes={[
            { titre: "Public", rendu: (l) => <Pastille segment={l.segment} /> },
            { titre: "Ventes", droite: true, className: "font-semibold text-emerald-700", rendu: (l) => fmtNombre(l.ventes) },
            { titre: "Chiffre d'affaires", droite: true, rendu: (l) => fmtMontant(l.ca) },
          ]}
        />
      </div>
    </Section>
  );
}

function Raisons({ raisons }: { raisons: IRapport["raisons"] }) {
  return (
    <Section titre="Pourquoi ils ne commandent pas" sousTitre="Raisons données aux agents, les plus fréquentes sur la période" couleur={ORANGE}>
      <BarresRepartition
        lignes={raisons.slice(0, 6).map((x) => ({ label: x.raison, nombre: x.nombre, part: x.part }))}
        vide="Aucune raison saisie sur la période."
      />
    </Section>
  );
}

/**
 * Le rapport lui-même, à partir de la réponse du serveur : en-tête, phrases
 * à retenir, puis les sections. Sans effet ni requête, il se rend tel quel
 * dans un test ou dans un aperçu.
 */
export function CorpsRapport({ r, pointDeVente }: { r: IRapport; pointDeVente: boolean }) {
  // C'est le serveur qui dit quelle section est hors filtre (public non choisi, ou campagne filtrée pour les
  // inscriptions) : elle reste à sa place, grisée. Les publics couverts ne servent qu'au résultat par public.
  const couverts = publicsCouverts(r.filtres.publics as Public[]);
  const montreInscrits = !r.inscriptions.hors_filtre;
  const montreCaptes = !r.captes.hors_filtre;
  const montreInactifs = !r.inactifs.hors_filtre;

  return (
    <div className="space-y-4">
      <EnTete r={r} />
      {sansActivite(r) ? (
        <Vide
          titre="Rien à rapporter sur cette période"
          texte="Aucun inscrit, aucun appel, aucune entrée dans le CRM ni aucune vente. Élargissez la période ou le choix des publics."
        />
      ) : (
        <>
          <ARetenir phrases={r.a_retenir} />
          {montreInscrits ? (
            <Inscriptions i={r.inscriptions} pointDeVente={pointDeVente} />
          ) : (
            <SectionHorsFiltre titre="Inscriptions" couleur={COULEUR_PUBLIC.JAMAIS_COMMANDE} />
          )}
          {montreCaptes ? (
            <Captes c={r.captes} />
          ) : (
            <SectionHorsFiltre titre="Clients Glovo et Yango" couleur={COULEUR_PUBLIC.GLOVO} />
          )}
          {montreInactifs ? <Inactifs i={r.inactifs} /> : <SectionHorsFiltre titre="Clients inactifs" couleur={COULEUR_PUBLIC.INACTIF} />}
          <Equipe e={r.equipe} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Resultat r={r.resultat} couverts={couverts} />
            <Raisons raisons={r.raisons} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * RAPPORT « OÙ EN SOMMES-NOUS » : une période, comparée à la précédente de
 * même durée, lue selon les trois leviers de croissance (inscriptions,
 * passage en direct des clients Glovo et Yango, reconquête des inactifs),
 * puis l'effort de l'équipe et le résultat. Le serveur calcule tout, phrases
 * comprises ; l'écran et le PDF lisent le même contrat.
 */
export function Rapport() {
  const [periode, setPeriode] = useState<IPeriode>({});
  const [exportEnCours, setExportEnCours] = useState(false);
  const publics = periode.segments ?? [];
  const pointDeVente = usePointDeVente();
  // Les campagnes se consultent au siège : un point de vente n'en demande aucune.
  const { data: toutesCampagnes = [] } = useCampagnesQuery({}, !pointDeVente);
  const campagnes = toutesCampagnes.filter((c) => c.status !== "PLANIFIED" && visePublics(c, publics));
  const requete = useRapportQuery(periode);
  const r = requete.data;

  /** Changer de publics garde la période ; la campagne reste si elle vise encore l'un d'eux. */
  const choisirPublics = (segments: Public[]) =>
    setPeriode((p) => {
      const campagne = toutesCampagnes.find((c) => c.id === p.campaign_id);
      const garder = !campagne || visePublics(campagne, segments);
      return { ...p, segments, campaign_id: garder ? p.campaign_id : undefined };
    });

  const exporter = async () => {
    setExportEnCours(true);
    try {
      await analyseAPI.rapportPdf(periode);
      toast.success("Rapport téléchargé");
    } catch (e) {
      toast.error((e as Error)?.message || "Export impossible");
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrePeriode valeur={periode} onChange={setPeriode} />
        <div className="flex flex-wrap items-center gap-2">
          <ChoixPublics valeur={publics} onChange={choisirPublics} />
          {!pointDeVente && (
            <div className="w-full sm:w-64">
              <ChampSelect
                valeur={periode.campaign_id ?? ""}
                onChange={(v) => setPeriode((p) => ({ ...p, campaign_id: v || undefined }))}
                vide="Toutes les campagnes"
                options={campagnes.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          )}
          <button
            type="button"
            onClick={exporter}
            disabled={exportEnCours || !r}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#F17922] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#e06a15] disabled:opacity-50"
          >
            {exportEnCours ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileDown className="h-4 w-4" aria-hidden />}
            Exporter en PDF
          </button>
        </div>
      </div>

      <EtatRequete requete={requete}>
        {r && (
          <div className={`transition-opacity ${requete.isFetching ? "opacity-60" : ""}`}>
            <CorpsRapport r={r} pointDeVente={pointDeVente} />
          </div>
        )}
      </EtatRequete>
    </div>
  );
}
