import React from "react";
import { LucideIcon } from "lucide-react";

export interface Onglet<K extends string> {
  cle: K;
  label: string;
  Icone: LucideIcon;
  badge?: number;
}

/** Onglets du module, identiques à ceux de l'acquisition Glovo/Yango. */
export function Onglets<K extends string>({
  onglets,
  actif,
  onChange,
}: {
  onglets: Onglet<K>[];
  actif: K;
  onChange: (cle: K) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-xl p-1 w-fit min-w-max">
        {onglets.map(({ cle, label, Icone, badge }) => {
          const choisi = actif === cle;
          return (
            <button
              key={cle}
              type="button"
              onClick={() => onChange(cle)}
              className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                choisi ? "bg-[#F17922] text-white" : "text-[#71717A] hover:text-gray-700"
              }`}
            >
              <Icone className="w-3.5 h-3.5" />
              {label}
              {!!badge && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 text-[11px] leading-5 ${
                    choisi ? "bg-white/25 text-white" : "bg-orange-100 text-[#C2410C]"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
