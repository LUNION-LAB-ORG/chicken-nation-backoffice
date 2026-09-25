import React, { useState } from "react";
import { CalendarRange } from "lucide-react";
import { IPeriode } from "../../types/analyse.type";
import { aujourdhuiISO } from "../../utils/crm-ui";
import { classeChamp } from "./Champs";

type Preset = "jour" | "semaine" | "mois" | "tout" | "libre";

const PRESETS: { cle: Preset; label: string }[] = [
  { cle: "jour", label: "Aujourd'hui" },
  { cle: "semaine", label: "7 jours" },
  { cle: "mois", label: "30 jours" },
  { cle: "tout", label: "Depuis le début" },
  { cle: "libre", label: "Période" },
];

const ilYa = (jours: number) => new Date(Date.now() - jours * 86_400_000).toISOString().slice(0, 10);

function periodePour(preset: Preset): IPeriode {
  switch (preset) {
    case "jour":
      return { from: aujourdhuiISO(), to: aujourdhuiISO() };
    case "semaine":
      return { from: ilYa(6), to: aujourdhuiISO() };
    case "mois":
      return { from: ilYa(29), to: aujourdhuiISO() };
    default:
      return {};
  }
}

/** Période des tableaux de bord : jour, semaine, 30 jours, période libre ou depuis le début (cahier §5). */
export function FiltrePeriode({ valeur, onChange }: { valeur: IPeriode; onChange: (p: IPeriode) => void }) {
  const [preset, setPreset] = useState<Preset>(valeur.from ? "mois" : "tout");

  const choisir = (p: Preset) => {
    setPreset(p);
    // Seules les dates changent : le public et la campagne choisis restent.
    if (p !== "libre") onChange({ ...valeur, from: undefined, to: undefined, ...periodePour(p) });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-xl p-1">
        {PRESETS.map((p) => (
          <button
            key={p.cle}
            type="button"
            onClick={() => choisir(p.cle)}
            className={`text-[13px] font-semibold px-3 py-1 rounded-lg whitespace-nowrap ${
              preset === p.cle ? "bg-white text-[#F17922] shadow-sm" : "text-[#71717A] hover:text-gray-700"
            }`}
          >
            {p.cle === "libre" && <CalendarRange className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
            {p.label}
          </button>
        ))}
      </div>
      {preset === "libre" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={valeur.from ?? ""}
            max={valeur.to || aujourdhuiISO()}
            onChange={(e) => onChange({ ...valeur, from: e.target.value || undefined })}
            className={`${classeChamp} w-auto`}
            aria-label="Du"
          />
          <span className="text-xs text-gray-400">au</span>
          <input
            type="date"
            value={valeur.to ?? ""}
            min={valeur.from}
            max={aujourdhuiISO()}
            onChange={(e) => onChange({ ...valeur, to: e.target.value || undefined })}
            className={`${classeChamp} w-auto`}
            aria-label="Au"
          />
        </div>
      )}
    </div>
  );
}
