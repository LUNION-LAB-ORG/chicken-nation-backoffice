"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { CHOIX_THEME, ChoixTheme as Choix } from "@/utils/theme";

const ICONES: Record<Choix, typeof Sun> = { clair: Sun, sombre: Moon, systeme: Monitor };

/** Thème de l'écran : Clair, Sombre ou Système. Dans le menu de l'utilisateur. */
export default function ChoixTheme() {
  const choix = useThemeStore((s) => s.choix);
  const choisir = useThemeStore((s) => s.choisir);

  return (
    <div className="px-3 py-2">
      <p className="mb-1.5 text-xs font-semibold text-gray-500">Thème</p>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1" role="radiogroup" aria-label="Thème">
        {CHOIX_THEME.map(({ valeur, libelle }) => {
          const Icone = ICONES[valeur];
          const actif = choix === valeur;
          return (
            <button
              key={valeur}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => choisir(valeur)}
              className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[11px] font-semibold transition ${
                actif ? "bg-white text-[#F17922] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icone className="h-4 w-4" />
              {libelle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
