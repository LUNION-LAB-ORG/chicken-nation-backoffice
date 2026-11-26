"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { CheckCircle } from "lucide-react";

interface IOrderField {
  key: string;
  label: string;
  /** Pour un `<select>` : la valeur du serveur quand la clé est absente en base. */
  placeholder: string;
  /**
   * Valeur du serveur quand la clé est absente et qu'elle dépend d'un autre
   * réglage : prend le pas sur `placeholder`.
   */
  defaut?: (values: Record<string, string>) => string;
  type?: string;
  step?: string;
  hint?: string;
  /** Si fourni : rendu en `<select>`, sur le modèle de DeliverySettings. */
  options?: { value: string; label: string }[];
}

const ORDER_KEYS: IOrderField[] = [
  {
    key: "order_tax_rate",
    label: "Taux de taxe (%)",
    placeholder: "0.01",
    type: "number",
    step: "0.001",
    hint: "Ex: 0.01 = 1%, 0.18 = 18%",
  },
  {
    key: "base_delivery_fee",
    label: "Frais de livraison de base (FCFA)",
    placeholder: "2000",
    type: "number",
    step: "100",
    hint: "Montant minimum de frais de livraison",
  },
];

/**
 * TYPES DE COMMANDE ET PAIEMENT, APPLICATION ET SITE (26/11, « même
 * réglage ») : pour chaque type, s'il est proposé aux clients et comment ils
 * peuvent payer. Lus par le serveur (`reglages-commande.rules.ts`) :
 * l'application et le site n'affichent que ce qui est permis, et la création
 * d'une commande le contrôle. Clé absente : la valeur de `placeholder`, ce
 * qui se faisait déjà.
 */
const OUI_NON = [
  { value: "1", label: "Oui : proposé aux clients" },
  { value: "0", label: "Non : retiré de l'application et du site" },
];

/**
 * Ancien réglage « Paiement à la livraison sur le site » (19/10), remplacé
 * par « Paiement d'une livraison ». Tant que le nouveau n'est pas enregistré,
 * le serveur part de l'ancien : proposé (ou jamais réglé), en ligne ou à la
 * livraison ; coupé, en ligne seulement. Même lecture que le serveur
 * (`paiementLivraisonActif`).
 */
const ANCIEN_REGLAGE_SITE = "order_paiement_livraison_site";
const paiementLivraisonParDefaut = (values: Record<string, string>): string => {
  const ancien = (values[ANCIEN_REGLAGE_SITE] ?? "").trim().toLowerCase();
  return ancien === "" || ancien === "1" || ancien === "true" || ancien === "oui" ? "LES_DEUX" : "EN_LIGNE";
};

const paiements = (lieu: string) => [
  { value: "EN_LIGNE", label: "En ligne seulement" },
  { value: "A_LA_RECEPTION", label: `${lieu} seulement` },
  { value: "LES_DEUX", label: `En ligne ou ${lieu.toLowerCase()}` },
];

const AIDE_PAIEMENT =
  "Les clients dont l'application n'est pas à jour ne peuvent payer qu'en ligne.";

const TYPES_KEYS: IOrderField[] = [
  { key: "order_type_livraison", label: "Livraison", placeholder: "1", options: OUI_NON },
  {
    key: "order_paiement_livraison",
    label: "Paiement d'une livraison",
    placeholder: "LES_DEUX",
    defaut: paiementLivraisonParDefaut,
    options: paiements("À la livraison"),
    hint: AIDE_PAIEMENT,
  },
  { key: "order_type_emporter", label: "À emporter", placeholder: "1", options: OUI_NON },
  {
    key: "order_paiement_emporter",
    label: "Paiement d'une commande à emporter",
    placeholder: "EN_LIGNE",
    options: paiements("Au restaurant"),
  },
  {
    key: "order_type_sur_place",
    label: "Sur place",
    placeholder: "0",
    options: [
      { value: "1", label: "Oui : proposé aux clients" },
      { value: "0", label: "Non : retiré de l'application" },
    ],
    hint: "Dans l'application seulement : le site ne propose pas la commande sur place.",
  },
  {
    key: "order_paiement_sur_place",
    label: "Paiement d'une commande sur place",
    placeholder: "EN_LIGNE",
    options: paiements("Au restaurant"),
  },
];

/**
 * COMMANDE À PAYER À LA RÉCEPTION (26/11) : ce qu'elle devient à sa création,
 * dans l'application comme sur le site. Clé absente : après confirmation, ce
 * que le site faisait déjà.
 */
const RECEPTION_KEY: IOrderField = {
  key: "order_paiement_reception",
  label: "Commande à payer à la réception",
  placeholder: "APRES_CONFIRMATION",
  options: [
    { value: "APRES_CONFIRMATION", label: "Après confirmation du centre d'appels" },
    { value: "DIRECTE", label: "Directe au restaurant" },
  ],
  hint: "Après confirmation : la commande arrive dans « À relancer », le centre d'appels appelle le client puis la transmet au restaurant. Directe : elle arrive tout de suite au restaurant. Choisissez Directe si personne ne peut appeler.",
};

/** Tous les réglages enregistrés par le bouton de l'onglet. */
const TOUS_LES_CHAMPS: IOrderField[] = [...ORDER_KEYS, ...TYPES_KEYS, RECEPTION_KEY];

const OrderSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettingsQuery("order_");
  const deliverySettings = useSettingsQuery("base_delivery");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.key] = s.value;
    for (const s of deliverySettings.data ?? []) map[s.key] = s.value;
    setValues(map);
  }, [settings, deliverySettings.data]);

  const handleSave = () => {
    let count = TOUS_LES_CHAMPS.length;
    for (const field of TOUS_LES_CHAMPS) {
      const value = values[field.key];
      if (value !== undefined) {
        updateSetting(
          { key: field.key, value, description: field.label },
          {
            onSuccess: () => {
              count--;
              if (count <= 0) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }
            },
          }
        );
      } else {
        count--;
      }
    }
  };

  /** Un réglage : liste de choix ou saisie, avec son aide. */
  const champ = (field: IOrderField) => (
    <div key={field.key}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {field.label}
      </label>
      {field.options ? (
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-white"
          // Absente ou vide, la clé vaut ce que le serveur applique alors (`placeholder`).
          value={values[field.key] || field.defaut?.(values) || field.placeholder}
          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          step={field.step}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          placeholder={field.placeholder}
          value={values[field.key] ?? ""}
          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
        />
      )}
      {field.hint && (
        <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Configuration des commandes</h3>
      <p className="text-sm text-gray-500 mb-6">Paramètres de taxe et frais de livraison</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ORDER_KEYS.map(champ)}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mt-8 mb-1">Types de commande et paiement</h3>
      <p className="text-sm text-gray-500 mb-6">
        Ce que les clients peuvent commander depuis l&apos;application et le site, et comment ils paient. Le centre
        d&apos;appels et la caisse ne sont pas concernés.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TYPES_KEYS.map(champ)}
        {champ(RECEPTION_KEY)}
      </div>

      <div className="mt-6 flex justify-end items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} /> Enregistré
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#F17922] text-blanc font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default OrderSettings;
