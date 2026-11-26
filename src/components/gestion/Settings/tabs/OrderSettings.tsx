"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { CheckCircle, ShoppingBag, Truck, Utensils } from "lucide-react";
import { useSettingsQuery } from "@/hooks/useSettingsQuery";
import { updateSetting } from "@/services/settings.service";
import {
  CLE_COUPURE_JUSQUA,
  CLE_COUPURE_MESSAGE,
  CLE_PARCOURS,
  TYPES_DE_COMMANDE,
  choixPaiement,
  clesAEnregistrer,
  ecrireTypePropose,
  libelleDuReglage,
  paiementAffiche,
  typePropose,
  type TypeDeCommande,
  type Valeurs,
} from "./reglages-commandes";

/**
 * PARAMÈTRES > VENTE > COMMANDES (26/11).
 *
 * Ce que les clients de l'application et du site peuvent commander, comment
 * ils paient, et ce que devient une commande à payer à la réception. Lu par
 * le serveur (`reglages-commande.rules.ts`), qui le contrôle à la création de
 * chaque commande. Les règles de l'écran sont dans `reglages-commandes.ts`.
 *
 * Retirés de cet onglet, pour qu'un réglage n'ait qu'un seul endroit :
 *  - « Taux de taxe » : c'est « Frais de service » de l'onglet Paiements ;
 *  - « Frais de livraison de base » : plus aucun calcul ne le lit, les frais
 *    de livraison viennent de la grille de l'onglet Livraison.
 * Ajoutée ici : la coupure de la livraison, qui était dans l'onglet Livraison
 * et faisait un second interrupteur pour le même type.
 */

const ICONES: Record<TypeDeCommande["cle"], React.FC<{ className?: string }>> = {
  livraison: Truck,
  emporter: ShoppingBag,
  sur_place: Utensils,
};

const PARCOURS = [
  {
    value: "APRES_CONFIRMATION",
    titre: "Après confirmation du centre d'appels",
    detail:
      "La commande arrive dans « À relancer ». Le centre d'appels appelle le client, puis la transmet au restaurant.",
  },
  {
    value: "DIRECTE",
    titre: "Directe au restaurant",
    detail: "La commande arrive tout de suite au restaurant. À choisir si personne ne peut appeler.",
  },
];

const CHAMP =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-white";
const LIBELLE = "block text-sm font-medium text-gray-700 mb-1.5";
const AIDE = "text-xs text-gray-400 mt-1";
const CARTE = "bg-white rounded-2xl border border-gray-200 p-4 sm:p-6";

const OrderSettings: React.FC = () => {
  const commandes = useSettingsQuery("order_");
  const coupure = useSettingsQuery("delivery.app_disabled");
  const queryClient = useQueryClient();
  const [valeurs, setValeurs] = useState<Valeurs>({});
  const [enCours, setEnCours] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  /** Ce qui est enregistré : sert à ne renvoyer que ce qui a changé. */
  const enBase = useMemo(() => {
    const lu: Valeurs = {};
    for (const s of commandes.data ?? []) lu[s.key] = s.value;
    for (const s of coupure.data ?? []) lu[s.key] = s.value;
    return lu;
  }, [commandes.data, coupure.data]);

  useEffect(() => {
    setValeurs(enBase);
  }, [enBase]);

  const aEnregistrer = clesAEnregistrer(valeurs, enBase);
  const modifier = (cle: string, valeur: string) => setValeurs((v) => ({ ...v, [cle]: valeur }));

  const enregistrer = async () => {
    if (!aEnregistrer.length) return;
    setEnCours(true);
    try {
      await Promise.all(
        aEnregistrer.map((cle) => updateSetting(cle, valeurs[cle] ?? "", libelleDuReglage(cle))),
      );
      toast.success("Paramètres enregistrés");
      setEnregistre(true);
      setTimeout(() => setEnregistre(false), 2000);
    } catch (e) {
      toast.error((e as Error)?.message || "Enregistrement impossible");
    } finally {
      setEnCours(false);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    }
  };

  if (commandes.isLoading || coupure.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  const parcours = valeurs[CLE_PARCOURS] === "DIRECTE" ? "DIRECTE" : "APRES_CONFIRMATION";

  return (
    <div className="space-y-4">
      <div className={CARTE}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Types de commande et paiement</h3>
        <p className="text-sm text-gray-500">
          Ce que les clients peuvent commander depuis l&apos;application et le site, et comment ils paient. Le centre
          d&apos;appels et la caisse ne sont pas concernés.
        </p>

        <div className="mt-5 space-y-3">
          {TYPES_DE_COMMANDE.map((type) => {
            const Icone = ICONES[type.cle];
            const propose = typePropose(type, valeurs);
            return (
              <section key={type.cle} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                  <h4 className="flex items-center gap-2 text-base font-bold text-gray-900">
                    <Icone className="w-4 h-4 text-[#F17922]" />
                    {type.titre}
                  </h4>
                  {type.appliSeulement && (
                    <span className="text-xs text-gray-500">
                      Dans l&apos;application seulement : le site ne propose pas la commande sur place.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LIBELLE} htmlFor={`propose-${type.cle}`}>
                      Proposé aux clients
                    </label>
                    <select
                      id={`propose-${type.cle}`}
                      className={CHAMP}
                      value={propose ? "1" : "0"}
                      onChange={(e) => setValeurs((v) => ecrireTypePropose(type, e.target.value === "1", v))}
                    >
                      <option value="1">Oui</option>
                      <option value="0">Non</option>
                    </select>
                  </div>
                  <div>
                    <label className={LIBELLE} htmlFor={`paiement-${type.cle}`}>
                      Paiement de la commande
                    </label>
                    <select
                      id={`paiement-${type.cle}`}
                      className={CHAMP}
                      value={paiementAffiche(type, valeurs)}
                      onChange={(e) => modifier(type.paiement, e.target.value)}
                    >
                      {choixPaiement(type.lieu).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Livraison coupée : ce que le client lit, et quand elle reprend. */}
                  {type.cle === "livraison" && !propose && (
                    <>
                      <div>
                        <label className={LIBELLE} htmlFor="coupure-message">
                          Message affiché au client
                        </label>
                        <input
                          id="coupure-message"
                          type="text"
                          className={CHAMP}
                          placeholder="La livraison est temporairement indisponible…"
                          value={valeurs[CLE_COUPURE_MESSAGE] ?? ""}
                          onChange={(e) => modifier(CLE_COUPURE_MESSAGE, e.target.value)}
                        />
                        <p className={AIDE}>Facultatif. Le centre d&apos;appels peut toujours saisir une livraison.</p>
                      </div>
                      <div>
                        <label className={LIBELLE} htmlFor="coupure-jusqua">
                          Reprise automatique le
                        </label>
                        <input
                          id="coupure-jusqua"
                          type="datetime-local"
                          className={CHAMP}
                          value={valeurs[CLE_COUPURE_JUSQUA] ?? ""}
                          onChange={(e) => modifier(CLE_COUPURE_JUSQUA, e.target.value)}
                        />
                        <p className={AIDE}>Facultatif. Sans date, la livraison reste coupée jusqu&apos;à votre retour ici.</p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Les frais de service se règlent dans Vente &gt; Paiements, les frais de livraison dans Livraison.
        </p>
      </div>

      <div className={CARTE}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Commande à payer à la réception</h3>
        <p className="text-sm text-gray-500">
          Ce que devient une commande que le client paie au livreur ou au restaurant, depuis l&apos;application comme
          depuis le site.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-label="Commande à payer à la réception">
          {PARCOURS.map((p) => {
            const choisi = parcours === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={choisi}
                onClick={() => modifier(CLE_PARCOURS, p.value)}
                className={`text-left rounded-xl border-2 p-4 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  choisi ? "border-[#F17922] bg-[#F17922]/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      choisi ? "border-[#F17922]" : "border-gray-300"
                    }`}
                  >
                    {choisi && <span className="h-2 w-2 rounded-full bg-[#F17922]" />}
                  </span>
                  {p.titre}
                </span>
                <span className="mt-1.5 block text-xs text-gray-500">{p.detail}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-end items-center gap-3">
        {enregistre ? (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} /> Enregistré
          </span>
        ) : (
          aEnregistrer.length > 0 && (
            <span className="text-sm text-gray-500">
              {aEnregistrer.length === 1 ? "1 modification à enregistrer" : `${aEnregistrer.length} modifications à enregistrer`}
            </span>
          )
        )}
        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours || aEnregistrer.length === 0}
          className="px-6 py-2.5 bg-[#F17922] text-blanc font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enCours ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default OrderSettings;
