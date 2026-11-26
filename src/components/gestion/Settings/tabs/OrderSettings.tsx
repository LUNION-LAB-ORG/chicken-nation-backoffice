"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { CheckCircle, ShoppingBag, Truck, Utensils } from "lucide-react";
import { useSettingsQuery } from "@/hooks/useSettingsQuery";
import { updateSetting } from "@/services/settings.service";
import {
  CANAUX,
  choixPaiement,
  cleParcours,
  clePaiement,
  cleType,
  clesAEnregistrer,
  coupureEnVigueur,
  libelleDuReglage,
  paiementAffiche,
  parcoursAffiche,
  typePropose,
  typesDuCanal,
  type Canal,
  type TypeDeCommande,
  type Valeurs,
} from "./reglages-commandes";

/**
 * PARAMÈTRES > VENTE > COMMANDES DE L'APPLI, COMMANDES DU SITE (26/11).
 *
 * « On doit avoir le paramétrage pour le site et le paramétrage pour l'appli,
 * pareil pour commande à payer à la réception » : chaque canal a son écran,
 * de même forme. Pour chaque type : s'il est proposé et comment il se paie ;
 * puis ce que devient une commande à payer à la réception. Le serveur
 * (`reglages-commande.rules.ts`) applique à chaque commande le paramétrage de
 * SON canal. Les règles de l'écran sont dans `reglages-commandes.ts`.
 *
 * Les deux écrans sont le même composant, qui reste monté : passer de l'un à
 * l'autre ne perd aucune saisie, et « Enregistrer » enregistre ce qui a été
 * modifié sur les deux.
 *
 * Un réglage, un seul endroit : les frais de service sont dans Paiements, les
 * frais de livraison et la coupure temporaire de la livraison dans Livraison.
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
const CARTE = "bg-white rounded-2xl border border-gray-200 p-4 sm:p-6";

const OrderSettings: React.FC<{ canal: Canal }> = ({ canal: cleCanal }) => {
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
    return lu;
  }, [commandes.data]);

  /** Coupure temporaire de la livraison : lue seulement, réglée dans Livraison. */
  const livraisonCoupee = useMemo(() => {
    const lu: Valeurs = {};
    for (const s of coupure.data ?? []) lu[s.key] = s.value;
    return coupureEnVigueur(lu);
  }, [coupure.data]);

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

  const canal = CANAUX[cleCanal];
  const parcours = parcoursAffiche(canal, valeurs);

  return (
    <div className="space-y-4">
      <div className={CARTE}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{canal.titre}</h3>
        <p className="text-sm text-gray-500">
          Ce que les clients peuvent commander depuis {canal.nom}, et comment ils paient.
          {cleCanal === "APP"
            ? " Le site web a son propre paramétrage, dans l'onglet voisin."
            : " L'application a son propre paramétrage, dans l'onglet voisin."}
        </p>

        <div className="mt-5 space-y-3">
          {typesDuCanal(canal).map((type) => {
            const Icone = ICONES[type.cle];
            const propose = typePropose(type, canal, valeurs);
            const id = `${type.cle}-${canal.suffixe}`;
            return (
              <section key={type.cle} className="rounded-xl border border-gray-200 p-4">
                <h4 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
                  <Icone className="w-4 h-4 text-[#F17922]" />
                  {type.titre}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LIBELLE} htmlFor={`propose-${id}`}>
                      Proposé aux clients
                    </label>
                    <select
                      id={`propose-${id}`}
                      className={CHAMP}
                      value={propose ? "1" : "0"}
                      onChange={(e) => modifier(cleType(type, canal), e.target.value)}
                    >
                      <option value="1">Oui</option>
                      <option value="0">Non</option>
                    </select>
                  </div>
                  <div>
                    <label className={LIBELLE} htmlFor={`paiement-${id}`}>
                      Paiement de la commande
                    </label>
                    <select
                      id={`paiement-${id}`}
                      className={CHAMP}
                      value={paiementAffiche(type, canal, valeurs)}
                      onChange={(e) => modifier(clePaiement(type, canal), e.target.value)}
                    >
                      {choixPaiement(type.lieu).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {type.cle === "livraison" && propose && livraisonCoupee && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    La livraison est suspendue pour le moment, sur l&apos;application et sur le site. Elle se rétablit
                    dans Livraison &gt; Frais et disponibilité.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <div className={CARTE}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Commande à payer à la réception</h3>
        <p className="text-sm text-gray-500">
          Ce que devient une commande passée depuis {canal.nom} que le client paie au livreur ou au restaurant.
        </p>
        <div
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"
          role="radiogroup"
          aria-label="Commande à payer à la réception"
        >
          {PARCOURS.map((p) => {
            const choisi = parcours === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={choisi}
                onClick={() => modifier(cleParcours(canal), p.value)}
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
              {aEnregistrer.length === 1
                ? "1 modification à enregistrer"
                : `${aEnregistrer.length} modifications à enregistrer`}
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
