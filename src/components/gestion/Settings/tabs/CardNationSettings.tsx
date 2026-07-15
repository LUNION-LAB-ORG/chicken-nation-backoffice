"use client";

import React, { useEffect, useState } from "react";
import {
  useSettingQuery,
  useSettingMutation,
} from "@/hooks/useSettingsQuery";
import { CheckCircle, FileCheck2, Zap } from "lucide-react";

const REQUIRE_JUSTIFICATIF_KEY = "card.require_justificatif";

const CardNationSettings: React.FC = () => {
  const { data, isLoading } = useSettingQuery(REQUIRE_JUSTIFICATIF_KEY);
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [requireJustificatif, setRequireJustificatif] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.value != null) {
      setRequireJustificatif(data.value === "true");
    }
  }, [data]);

  const handleSave = () => {
    updateSetting(
      {
        key: REQUIRE_JUSTIFICATIF_KEY,
        value: requireJustificatif ? "true" : "false",
        description:
          "Carte de la Nation : exiger un justificatif étudiant à la demande (V2). false = demande déclarative V1 (sans justificatif). Dans les deux cas, la demande arrive en attente et la carte n'est émise qu'après validation au backoffice.",
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        Carte de la Nation
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Mode de <strong>demande</strong> de la carte. La carte est ouverte à
        tous. Dans les deux modes, la demande arrive en attente et la carte
        n&apos;est émise qu&apos;après <strong>validation au backoffice</strong>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode V1 : déclaratif */}
        <button
          type="button"
          onClick={() => setRequireJustificatif(false)}
          className={`text-left rounded-xl border-2 p-5 transition-all ${
            !requireJustificatif
              ? "border-[#F17922] bg-orange-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-[#F17922]" />
            <span className="font-semibold text-gray-900">
              Mode déclaratif (V1)
            </span>
            {!requireJustificatif && (
              <span className="ml-auto text-[11px] font-semibold text-[#F17922] uppercase">
                Actif
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            La demande (opt-in) est <strong>déclarative</strong>, sans
            justificatif. Le profil (Étudiant / Professionnel) est déclaratif.
            Elle arrive en attente et est <strong>validée au backoffice</strong>
            pour générer la carte.
          </p>
        </button>

        {/* Mode V2 : justificatif */}
        <button
          type="button"
          onClick={() => setRequireJustificatif(true)}
          className={`text-left rounded-xl border-2 p-5 transition-all ${
            requireJustificatif
              ? "border-[#F17922] bg-orange-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="w-5 h-5 text-[#F17922]" />
            <span className="font-semibold text-gray-900">
              Justificatif requis (V2)
            </span>
            {requireJustificatif && (
              <span className="ml-auto text-[11px] font-semibold text-[#F17922] uppercase">
                Actif
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            La demande exige un <strong>justificatif étudiant</strong>. Comme en
            mode déclaratif, elle passe par une <strong>revue admin</strong>
            (approbation / rejet) avant émission de la carte.
          </p>
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Clé de configuration : <code>{REQUIRE_JUSTIFICATIF_KEY}</code>
      </p>

      <div className="mt-6 flex justify-end items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} /> Enregistré
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#F17922] text-white font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default CardNationSettings;
