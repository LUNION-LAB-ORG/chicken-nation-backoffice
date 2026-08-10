"use client";

import React, { useMemo } from "react";
import Checkbox from "@/components/ui/Checkbox";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  DishOptionGroupPayload,
  DishOptionItemPayload,
} from "../types/dish-option.types";

/**
 * MENUS COMPOSABLES — éditeur des groupes d'options d'un plat.
 *
 * Un seul burger remplace huit déclinaisons : le client choisit sa sauce, son
 * format, et paie ce qu'il ajoute. Cet écran sert à décrire ces questions.
 *
 * Composant volontairement sans état interne ni appel réseau. Il reçoit la
 * configuration et la renvoie modifiée, ce qui lui permet de servir aussi bien
 * l'écran de création, où le plat n'existe pas encore et où la configuration
 * attend en mémoire, que l'écran de modification, où elle part au serveur.
 *
 * Chaque groupe affiche en clair ce que le client verra, parce qu'un gestionnaire
 * ne devrait pas avoir à traduire mentalement « minimum 1, maximum 1 » en
 * « il choisit une sauce et une seule ».
 */

const CADRE =
  "w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent";
const CHAMP =
  "w-full py-1.5 text-[13px] focus:outline-none text-[#595959] font-semibold bg-transparent";
const LIBELLE = "block text-[13px] font-semibold text-gray-700";

/** Groupe neuf, prérempli sur le cas le plus courant : une sauce à choisir. */
const groupeVierge = (): DishOptionGroupPayload => ({
  name: "",
  description: "",
  required: true,
  min_select: 1,
  max_select: 1,
  items: [{ label: "", price_delta: 0, is_default: false, available: true }],
});

const choixVierge = (): DishOptionItemPayload => ({
  label: "",
  price_delta: 0,
  is_default: false,
  available: true,
});

/**
 * Traduit les bornes en une phrase que le gestionnaire peut relire, et signale
 * les réglages qui bloqueraient le client dans l'écran de composition. Le
 * serveur refuse ces mêmes cas, mais les voir tout de suite évite un aller
 * retour inutile.
 */
function resumerGroupe(groupe: DishOptionGroupPayload): {
  phrase: string;
  alerte: string | null;
} {
  const total = groupe.items.length;
  const disponibles = groupe.items.filter((i) => i.available !== false).length;
  const requis = groupe.required !== false;
  const min = groupe.min_select ?? (requis ? 1 : 0);
  const max = groupe.max_select ?? 1;
  const payants = groupe.items.filter((i) => (i.price_delta ?? 0) > 0).length;

  let phrase: string;
  if (max === 1 && min === 1) {
    phrase = `Le client choisit 1 option parmi ${total}`;
  } else if (min === max) {
    phrase = `Le client choisit ${min} options parmi ${total}`;
  } else if (min === 0) {
    phrase = `Le client peut choisir jusqu'à ${max} options parmi ${total}`;
  } else {
    phrase = `Le client choisit entre ${min} et ${max} options parmi ${total}`;
  }
  if (payants > 0) {
    phrase += `, dont ${payants} payante${payants > 1 ? "s" : ""}`;
  }
  if (!requis) {
    phrase += ". Groupe facultatif";
  }

  let alerte: string | null = null;
  if (max < min) {
    alerte = "Le maximum est inférieur au minimum";
  } else if (max > total) {
    alerte = `Le maximum (${max}) dépasse le nombre de choix proposés (${total})`;
  } else if (requis && min < 1) {
    alerte = "Un groupe obligatoire demande au moins un choix";
  } else if (requis && disponibles < min) {
    alerte = `${disponibles} choix disponible pour un minimum de ${min}`;
  } else if (groupe.items.filter((i) => i.is_default).length > max) {
    alerte = "Plus de choix présélectionnés que le maximum autorisé";
  } else if (groupe.items.some((i) => !i.label.trim())) {
    alerte = "Un choix n'a pas de libellé";
  }

  return { phrase, alerte };
}

export default function DishOptionsEditor({
  groups,
  onChange,
  supplements = [],
  disabled = false,
}: {
  groups: DishOptionGroupPayload[];
  onChange: (groups: DishOptionGroupPayload[]) => void;
  /**
   * Catalogue de suppléments, pour rattacher un choix à un article connu.
   * Volontairement réduit à ce qui est affiché : le catalogue arrive de deux
   * sources aux types divergents selon l'écran appelant.
   */
  supplements?: Array<{ id: string; name: string }>;
  disabled?: boolean;
}) {
  const majGroupe = (index: number, champs: Partial<DishOptionGroupPayload>) => {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...champs } : g)));
  };

  const majChoix = (
    indexGroupe: number,
    indexChoix: number,
    champs: Partial<DishOptionItemPayload>,
  ) => {
    onChange(
      groups.map((g, i) =>
        i !== indexGroupe
          ? g
          : {
              ...g,
              items: g.items.map((it, j) =>
                j === indexChoix ? { ...it, ...champs } : it,
              ),
            },
      ),
    );
  };

  const deplacerGroupe = (index: number, sens: -1 | 1) => {
    const cible = index + sens;
    if (cible < 0 || cible >= groups.length) return;
    const copie = [...groups];
    [copie[index], copie[cible]] = [copie[cible], copie[index]];
    onChange(copie);
  };

  const alertes = useMemo(
    () => groups.map((g) => resumerGroupe(g)),
    [groups],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-[#595959]">Menu composable</h3>
          <p className="mt-0.5 text-[12px] text-gray-500">
            Les questions posées au client avant qu'il ajoute ce plat au panier.
            Sans aucun groupe, le plat reste un plat ordinaire.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...groups, groupeVierge()])}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#F17922] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#F17922]/90 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} /> Ajouter un groupe
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#D9D9D9] px-4 py-8 text-center">
          <p className="text-[13px] font-semibold text-gray-600">
            Ce plat n'a aucune option
          </p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-gray-500">
            Ajoutez un groupe pour laisser le client composer, par exemple
            « Choix de sauce » avec Mayonnaise, Ketchup et Algérienne.
          </p>
        </div>
      ) : (
        groups.map((groupe, indexGroupe) => {
          const { phrase, alerte } = alertes[indexGroupe];
          const requis = groupe.required !== false;

          return (
            <div
              key={indexGroupe}
              className="rounded-2xl border-2 border-[#D9D9D9]/50 p-4 space-y-4"
            >
              {/* Ligne de tête : ordre, titre, suppression */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    type="button"
                    disabled={disabled || indexGroupe === 0}
                    onClick={() => deplacerGroupe(indexGroupe, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#F17922] disabled:opacity-30 cursor-pointer"
                    aria-label="Monter le groupe"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || indexGroupe === groups.length - 1}
                    onClick={() => deplacerGroupe(indexGroupe, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#F17922] disabled:opacity-30 cursor-pointer"
                    aria-label="Descendre le groupe"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className={CADRE}>
                    <input
                      type="text"
                      value={groupe.name}
                      disabled={disabled}
                      onChange={(e) =>
                        majGroupe(indexGroupe, { name: e.target.value })
                      }
                      className={CHAMP}
                      placeholder="Titre du groupe, par exemple Choix de sauce"
                    />
                  </div>
                  <div className={CADRE}>
                    <input
                      type="text"
                      value={groupe.description ?? ""}
                      disabled={disabled}
                      onChange={(e) =>
                        majGroupe(indexGroupe, { description: e.target.value })
                      }
                      className={CHAMP}
                      placeholder="Aide affichée sous le titre (facultatif)"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange(groups.filter((_, i) => i !== indexGroupe))
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                  aria-label="Supprimer le groupe"
                  title="Supprimer ce groupe"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Contraintes de sélection */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <Checkbox
                    id={`groupe-requis-${indexGroupe}`}
                    checked={requis}
                    onChange={(checked) =>
                      majGroupe(indexGroupe, {
                        required: checked,
                        // Un groupe facultatif accepte zéro réponse ; un groupe
                        // obligatoire en exige au moins une. Recaler le minimum
                        // évite un réglage que le serveur refuserait.
                        min_select: checked
                          ? Math.max(1, groupe.min_select ?? 1)
                          : 0,
                      })
                    }
                  />
                  <label
                    htmlFor={`groupe-requis-${indexGroupe}`}
                    className={`ml-2 ${LIBELLE}`}
                  >
                    Réponse obligatoire
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[13px] text-gray-600">Minimum</label>
                  <input
                    type="number"
                    min={0}
                    value={groupe.min_select ?? (requis ? 1 : 0)}
                    disabled={disabled}
                    onChange={(e) =>
                      majGroupe(indexGroupe, {
                        min_select: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-16 rounded-xl border-2 border-[#D9D9D9]/50 px-2 py-1 text-[13px] font-semibold text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[13px] text-gray-600">Maximum</label>
                  <input
                    type="number"
                    min={1}
                    value={groupe.max_select ?? 1}
                    disabled={disabled}
                    onChange={(e) =>
                      majGroupe(indexGroupe, {
                        max_select: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-16 rounded-xl border-2 border-[#D9D9D9]/50 px-2 py-1 text-[13px] font-semibold text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
                  />
                </div>
              </div>

              {/* Ce que le client verra, en toutes lettres */}
              <p className="text-[12px] text-gray-500">{phrase}</p>
              {alerte && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
                  {alerte}
                </p>
              )}

              {/* Choix */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className={LIBELLE}>Choix proposés</span>
                  <span className="ml-2 rounded-lg bg-gray-100 px-2 py-1 text-[13px] text-gray-500">
                    {groupe.items.length}
                  </span>
                </div>

                {groupe.items.map((choix, indexChoix) => (
                  <div
                    key={indexChoix}
                    className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 px-3 py-2"
                  >
                    <input
                      type="text"
                      value={choix.label}
                      disabled={disabled}
                      onChange={(e) =>
                        majChoix(indexGroupe, indexChoix, {
                          label: e.target.value,
                        })
                      }
                      className="min-w-[140px] flex-1 rounded-lg border border-[#D9D9D9] bg-white px-2 py-1.5 text-[13px] font-semibold text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
                      placeholder="Libellé, par exemple Mayonnaise"
                    />

                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={choix.price_delta ?? 0}
                        disabled={disabled}
                        onChange={(e) =>
                          majChoix(indexGroupe, indexChoix, {
                            price_delta: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-28 rounded-lg border border-[#D9D9D9] bg-white py-1.5 pl-2 pr-11 text-[13px] font-semibold text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
                        placeholder="0"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#acacac]">
                        XOF
                      </span>
                    </div>

                    <select
                      value={choix.supplement_id ?? ""}
                      disabled={disabled}
                      onChange={(e) =>
                        majChoix(indexGroupe, indexChoix, {
                          supplement_id: e.target.value || null,
                        })
                      }
                      className="min-w-[150px] rounded-lg border border-[#D9D9D9] bg-white px-2 py-1.5 text-[13px] text-[#595959] focus:outline-none focus:ring-2 focus:ring-[#F17922]"
                      title="Rattacher ce choix à un supplément du catalogue, pour la cuisine et les tickets"
                    >
                      <option value="">Aucun supplément lié</option>
                      {supplements.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1 text-[12px] text-gray-600">
                      <input
                        type="checkbox"
                        checked={!!choix.is_default}
                        disabled={disabled}
                        onChange={(e) =>
                          majChoix(indexGroupe, indexChoix, {
                            is_default: e.target.checked,
                          })
                        }
                        className="accent-[#F17922]"
                      />
                      Par défaut
                    </label>

                    <label className="flex items-center gap-1 text-[12px] text-gray-600">
                      <input
                        type="checkbox"
                        checked={choix.available !== false}
                        disabled={disabled}
                        onChange={(e) =>
                          majChoix(indexGroupe, indexChoix, {
                            available: e.target.checked,
                          })
                        }
                        className="accent-[#F17922]"
                      />
                      Disponible
                    </label>

                    <button
                      type="button"
                      disabled={disabled || groupe.items.length <= 1}
                      onClick={() =>
                        majGroupe(indexGroupe, {
                          items: groupe.items.filter((_, j) => j !== indexChoix),
                        })
                      }
                      title={
                        groupe.items.length <= 1
                          ? "Un groupe doit proposer au moins un choix"
                          : "Retirer ce choix"
                      }
                      aria-label="Retirer ce choix"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    majGroupe(indexGroupe, {
                      items: [...groupe.items, choixVierge()],
                    })
                  }
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#F17922] transition-colors hover:text-[#e06816] disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={16} /> Ajouter un choix
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/** Vrai si la configuration comporte une incohérence que le serveur refusera. */
export function configurationInvalide(
  groups: DishOptionGroupPayload[],
): string | null {
  const titres = new Set<string>();
  for (const groupe of groups) {
    if (!groupe.name.trim()) return "Un groupe n'a pas de titre";
    const titre = groupe.name.trim().toLowerCase();
    if (titres.has(titre)) {
      return `Deux groupes portent le titre « ${groupe.name} »`;
    }
    titres.add(titre);
    const { alerte } = resumerGroupe(groupe);
    if (alerte) return `« ${groupe.name} » : ${alerte.toLowerCase()}`;
  }
  return null;
}
