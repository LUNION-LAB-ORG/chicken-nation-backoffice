"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { AlertTriangle, CheckCircle, ChevronDown, GitMerge, Store } from "lucide-react";

import { useSettingsQuery } from "@/hooks/useSettingsQuery";
import { deleteSetting, updateSetting } from "@/services/settings.service";
// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useRestaurantListQuery } from "../../../restaurants/queries/restaurant-list.query";
import {
  CLE_METHODE,
  CLE_RESTAURANTS,
  GROUPE_ANCIENNE_METHODE,
  GROUPES_NOUVELLE_METHODE,
  METHODES,
  TEXTE_ANCIENNE_METHODE_CHOISIE,
  TEXTE_AUSSI_ANCIENNE,
  TOUS_LES_REGLAGES,
  libelleAvecUnite,
  libelleOuiNon,
  lireMethode,
  lireRestaurants,
  planEnregistrement,
  resumeRestaurants,
  valeurAppliquee,
  type Changement,
  type DefinitionReglage,
  type GroupeReglages,
  type Methode,
} from "../../utils/reglages-regroupement";
import {
  garderSiModifie,
  memeListe,
  rehydrater,
  type EtatRegroupement,
} from "../../utils/enregistrement-livraison";

/**
 * Ce que la page « Paramètres > Livraison » peut demander à la section : son
 * bouton « Enregistrer » du bas enregistre aussi le regroupement.
 */
export interface PoigneeRegroupement {
  /** Modifications et saisies refusées en cours. */
  etat(): EtatRegroupement;
  /**
   * Écrit les modifications, sans message ni relecture (la page s'en
   * charge). Rend le nombre d'écritures ; une écriture refusée lève l'erreur.
   */
  enregistrer(): Promise<number>;
}

/** Écrit ou efface chaque réglage du plan. */
async function executerPlan(changements: Changement[]): Promise<number> {
  await Promise.all(
    changements.map((c) =>
      c.action === "effacer" ? deleteSetting(c.cle) : updateSetting(c.cle, c.valeur, c.description),
    ),
  );
  return changements.length;
}

/**
 * Paramètres > Livraison, section « Regroupement des commandes »
 * (conception 6.1). Méthode Nouvelle (par défaut) ou Ancienne, restaurants
 * concernés, chaque limite avec son libellé et son unité, réglages des lots
 * rangés sous « Ancienne méthode ». Une saisie que le serveur refuserait
 * n'est pas enregistrée ; une valeur déjà en base qu'il refuse est signalée
 * avec celle qu'il applique à la place.
 *
 * Bouton d'enregistrement propre à la section (comme « Service par
 * restaurant ») : un seul message au lieu d'un par réglage, et rien n'est
 * écrit tant qu'une saisie est refusée. Le bouton « Enregistrer » du bas de
 * la page enregistre aussi la section (`PoigneeRegroupement`), et une
 * relecture des réglages (après l'un ou l'autre bouton) ne remplace que les
 * champs que l'écran n'a pas modifiés (relecture du 23/10).
 */
function SectionRegroupement(
  { surEtat }: { surEtat?: (etat: EtatRegroupement) => void },
  ref: React.ForwardedRef<PoigneeRegroupement>,
) {
  const queryClient = useQueryClient();
  const course = useSettingsQuery("course.");
  const livreur = useSettingsQuery("deliverer.");
  const preparation = useSettingsQuery("preparation.");
  const maps = useSettingsQuery("maps.");
  const { data: restaurantsResp, isLoading: restaurantsEnChargement } = useRestaurantListQuery({ limit: 100 });
  const restaurants = ((restaurantsResp?.data ?? []) as { id: string; name: string }[]) || [];

  const enChargement = course.isLoading || livreur.isLoading || preparation.isLoading || maps.isLoading;

  // Valeurs en base, clé → valeur brute.
  const enregistrees = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const liste of [course.data, livreur.data, preparation.data, maps.data]) {
      for (const s of liste ?? []) map[s.key] = s.value;
    }
    return map;
  }, [course.data, livreur.data, preparation.data, maps.data]);

  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const [methode, setMethode] = useState<Methode>("v2");
  const [choisis, setChoisis] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  // Ce que la dernière lecture a mis à l'écran : une relecture ne remplace
  // que les champs restés tels quels depuis.
  const hydrateesRef = useRef<{ saisies: Record<string, string>; methode: Methode; choisis: string[] } | null>(null);

  // Hydratation depuis la base (et après chaque enregistrement, de la section
  // ou de la page).
  useEffect(() => {
    const initiales: Record<string, string> = {};
    for (const def of TOUS_LES_REGLAGES) {
      const brut = enregistrees[def.cle];
      if (brut === undefined || brut.trim() === "") {
        initiales[def.cle] = "";
        continue;
      }
      const lue = valeurAppliquee(def, brut);
      // Un oui ou non lisible est montré tel que le serveur le lit ; une
      // valeur refusée reste affichée telle quelle, avec son alerte.
      initiales[def.cle] = def.type === "oui_non" && !lue.refusee ? lue.valeur : brut;
    }
    const lues = {
      saisies: initiales,
      methode: lireMethode(enregistrees[CLE_METHODE]).methode,
      choisis: lireRestaurants(enregistrees[CLE_RESTAURANTS]).ids,
    };
    const avant = hydrateesRef.current;
    hydrateesRef.current = lues;
    setSaisies((locales) => rehydrater({ locales, hydratees: avant?.saisies ?? null, serveur: lues.saisies }));
    setMethode((locale) => (avant ? garderSiModifie({ locale, hydratee: avant.methode, serveur: lues.methode }) : lues.methode));
    setChoisis((locaux) =>
      avant ? garderSiModifie({ locale: locaux, hydratee: avant.choisis, serveur: lues.choisis, egal: memeListe }) : lues.choisis,
    );
  }, [enregistrees]);

  const plan = useMemo(
    () => planEnregistrement({ saisies, enregistrees, methode, restaurants: choisis }),
    [saisies, enregistrees, methode, choisis],
  );

  // Valeurs en base refusées par le serveur (et pas encore corrigées à l'écran).
  const refuseesEnBase = useMemo(() => {
    const liste: { cle: string; message: string }[] = [];
    for (const def of TOUS_LES_REGLAGES) {
      const lue = valeurAppliquee(def, enregistrees[def.cle]);
      const saisie = saisies[def.cle];
      if (lue.refusee && lue.message && (saisie === undefined || saisie === enregistrees[def.cle])) {
        liste.push({ cle: def.cle, message: lue.message });
      }
    }
    const methodeLue = lireMethode(enregistrees[CLE_METHODE]);
    if (methodeLue.refusee) {
      liste.push({
        cle: CLE_METHODE,
        message: `Valeur enregistrée « ${enregistrees[CLE_METHODE]} » refusée : le serveur applique la nouvelle méthode.`,
      });
    }
    if (lireRestaurants(enregistrees[CLE_RESTAURANTS]).refusee) {
      liste.push({
        cle: CLE_RESTAURANTS,
        message: "Liste de restaurants illisible : le serveur l'applique à tous les restaurants.",
      });
    }
    return liste;
  }, [enregistrees, saisies]);
  const refusParCle = useMemo(() => new Map(refuseesEnBase.map((r) => [r.cle, r.message])), [refuseesEnBase]);

  const nbErreurs = Object.keys(plan.erreurs).length;
  const nbChangements = plan.changements.length;

  // La page suit les modifications de la section (texte et blocage de son
  // bouton du bas).
  useEffect(() => {
    surEtat?.({ changements: nbChangements, erreurs: nbErreurs });
  }, [nbChangements, nbErreurs, surEtat]);

  useImperativeHandle(
    ref,
    () => ({
      etat: () => ({ changements: nbChangements, erreurs: nbErreurs }),
      enregistrer: async () => {
        if (nbErreurs > 0) throw new Error("Regroupement : une valeur est refusée.");
        return executerPlan(plan.changements);
      },
    }),
    [plan, nbChangements, nbErreurs],
  );

  const enregistrer = async () => {
    if (nbErreurs > 0 || nbChangements === 0) return;
    setEnCours(true);
    try {
      await executerPlan(plan.changements);
      toast.success("Regroupement enregistré");
      setEnregistre(true);
      setTimeout(() => setEnregistre(false), 2000);
    } catch (e) {
      toast.error((e as Error)?.message || "Enregistrement impossible");
    } finally {
      setEnCours(false);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    }
  };

  const changer = (cle: string, valeur: string) => setSaisies((prev) => ({ ...prev, [cle]: valeur }));
  const basculerRestaurant = (id: string) =>
    setChoisis((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (enChargement) {
    return (
      <section className="border-t border-gray-100 pt-6">
        <p className="py-4 text-sm text-gray-400">Chargement du regroupement…</p>
      </section>
    );
  }

  return (
    <section className="border-t border-gray-100 pt-6 space-y-6">
      <div>
        <h4 className="mb-1 flex items-center gap-2 text-base font-bold text-[#F17922]">
          <GitMerge className="h-4 w-4" />
          Regroupement des commandes
        </h4>
        <p className="text-xs text-gray-500">
          Les commandes qui vont dans la même direction partent ensemble, sans faire attendre une commande prête
          au-delà des limites ci-dessous.
        </p>
      </div>

      {refuseesEnBase.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {refuseesEnBase.length === 1
              ? "1 réglage enregistré est refusé par le serveur, qui applique sa valeur par défaut."
              : `${refuseesEnBase.length} réglages enregistrés sont refusés par le serveur, qui applique leur valeur par défaut.`}{" "}
            Corrigez-les ci-dessous.
          </p>
        </div>
      )}

      {/* Méthode */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Méthode de regroupement</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="radiogroup" aria-label="Méthode de regroupement">
          {METHODES.map((m) => {
            const actif = methode === m.valeur;
            return (
              <button
                key={m.valeur}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setMethode(m.valeur)}
                className={`rounded-xl border-2 p-3 text-left transition ${
                  actif ? "border-[#F17922] bg-orange-50" : "border-gray-200 bg-white hover:border-orange-200"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <span
                    className={`h-4 w-4 rounded-full border-2 ${actif ? "border-[#F17922] bg-[#F17922]" : "border-gray-300"}`}
                    aria-hidden
                  />
                  {m.libelle}
                  {m.valeur === "v2" && (
                    <span className="rounded-md bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                      Par défaut
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-500">{m.description}</span>
              </button>
            );
          })}
        </div>
        {refusParCle.get(CLE_METHODE) && <MessageRefus texte={refusParCle.get(CLE_METHODE)!} />}
      </div>

      {/* Restaurants concernés */}
      {methode === "v2" && (
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Store className="h-4 w-4 text-[#F17922]" />
            Restaurants concernés : {resumeRestaurants(choisis)}
          </p>
          <p className="mb-2 text-xs text-gray-400">
            Aucun coché : la nouvelle méthode vaut pour tous les restaurants. Les autres gardent l&apos;ancienne.
          </p>
          {restaurantsEnChargement ? (
            <p className="text-sm text-gray-400">Chargement…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {restaurants.map((r) => {
                const coche = choisis.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      coche ? "border-[#F17922] bg-orange-50 text-gray-900" : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-[#F17922]"
                      checked={coche}
                      onChange={() => basculerRestaurant(r.id)}
                    />
                    {r.name}
                  </label>
                );
              })}
              {/* Identifiants enregistrés qui ne sont plus dans la liste : gardés, montrés. */}
              {choisis
                .filter((id) => !restaurants.some((r) => r.id === id))
                .map((id) => (
                  <label
                    key={id}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500"
                  >
                    <input type="checkbox" checked onChange={() => basculerRestaurant(id)} />
                    Restaurant inconnu ({id.slice(0, 8)})
                  </label>
                ))}
            </div>
          )}
          {refusParCle.get(CLE_RESTAURANTS) && <MessageRefus texte={refusParCle.get(CLE_RESTAURANTS)!} />}
        </div>
      )}

      {methode === "v1" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {TEXTE_ANCIENNE_METHODE_CHOISIE}
        </p>
      )}

      {GROUPES_NOUVELLE_METHODE.map((g) => (
        <Groupe
          key={g.titre}
          groupe={g}
          saisies={saisies}
          erreurs={plan.erreurs}
          refus={refusParCle}
          onChange={changer}
          ancienneChoisie={methode === "v1"}
        />
      ))}

      <details open={methode === "v1"} className="group rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-gray-800">
          {GROUPE_ANCIENNE_METHODE.titre}
          <ChevronDown className="h-4 w-4 text-gray-500 transition group-open:rotate-180" />
        </summary>
        <div className="mt-4">
          <Groupe
            groupe={GROUPE_ANCIENNE_METHODE}
            saisies={saisies}
            erreurs={plan.erreurs}
            refus={refusParCle}
            onChange={changer}
            sansTitre
          />
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {nbErreurs > 0 && (
          <span className="text-sm font-medium text-red-600">
            {nbErreurs === 1 ? "1 valeur refusée : corrigez-la pour enregistrer." : `${nbErreurs} valeurs refusées : corrigez-les pour enregistrer.`}
          </span>
        )}
        {nbErreurs === 0 && nbChangements > 0 && (
          <span className="text-sm text-gray-500">
            {nbChangements === 1 ? "1 modification" : `${nbChangements} modifications`}
          </span>
        )}
        {enregistre && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle size={16} /> Enregistré
          </span>
        )}
        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours || nbErreurs > 0 || nbChangements === 0}
          className="h-10 rounded-xl bg-[#F17922] px-5 text-sm font-semibold text-white transition hover:bg-[#e06816] disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer le regroupement"}
        </button>
      </div>
    </section>
  );
}

const RegroupementSettings = forwardRef(SectionRegroupement);
export default RegroupementSettings;

function Groupe({
  groupe,
  saisies,
  erreurs,
  refus,
  onChange,
  sansTitre,
  ancienneChoisie,
}: {
  groupe: GroupeReglages;
  saisies: Record<string, string>;
  erreurs: Record<string, string>;
  refus: Map<string, string>;
  onChange: (cle: string, valeur: string) => void;
  sansTitre?: boolean;
  /** Ancienne méthode choisie : les réglages qu'elle lit aussi sont repérés. */
  ancienneChoisie?: boolean;
}) {
  return (
    <div>
      {!sansTitre && <p className="mb-1 text-sm font-bold text-gray-800">{groupe.titre}</p>}
      <p className="mb-3 text-xs text-gray-500">{groupe.description}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {groupe.reglages.map((def) => (
          <Champ
            key={def.cle}
            def={def}
            valeur={saisies[def.cle] ?? ""}
            erreur={erreurs[def.cle]}
            refus={refus.get(def.cle)}
            onChange={(v) => onChange(def.cle, v)}
            repere={ancienneChoisie && def.aussiAncienne ? TEXTE_AUSSI_ANCIENNE : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function Champ({
  def,
  valeur,
  erreur,
  refus,
  onChange,
  repere,
}: {
  def: DefinitionReglage;
  valeur: string;
  erreur?: string;
  refus?: string;
  onChange: (valeur: string) => void;
  /** Petit repère sous le libellé (« Aussi pour l'ancienne méthode »). */
  repere?: string;
}) {
  const id = `reglage-${def.cle.replace(/\./g, "-")}`;
  const bordure = erreur || refus ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-orange-500";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {libelleAvecUnite(def)}
      </label>
      {repere && (
        <span className="mb-1.5 inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
          {repere}
        </span>
      )}
      {def.type === "oui_non" ? (
        <select
          id={id}
          value={valeur === "1" || valeur === "0" ? valeur : ""}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${bordure}`}
        >
          <option value="">Par défaut ({libelleOuiNon(def.defaut).toLowerCase()})</option>
          <option value="1">Oui</option>
          <option value="0">Non</option>
        </select>
      ) : (
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={valeur}
          placeholder={`${def.defaut} par défaut`}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!erreur}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${bordure}`}
        />
      )}
      {erreur ? (
        <p className="mt-1 text-xs font-medium text-red-600">{erreur}</p>
      ) : refus ? (
        <MessageRefus texte={refus} />
      ) : (
        def.aide && <p className="mt-1 text-xs leading-relaxed text-gray-400">{def.aide}</p>
      )}
    </div>
  );
}

function MessageRefus({ texte }: { texte: string }) {
  return (
    <p className="mt-1 flex items-start gap-1 text-xs font-medium text-red-600">
      <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
      {texte}
    </p>
  );
}

