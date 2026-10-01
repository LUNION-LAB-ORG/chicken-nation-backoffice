import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { CLE_REGLAGES_SON } from "../constantes/relance.constante";

/**
 * Stockage du navigateur sous try/catch : une fenêtre privée ou des données
 * de site bloquées lèvent à la lecture. Le réglage vit alors en mémoire, le
 * temps de la page, au lieu de faire tomber l'écran.
 */
const memoire = new Map<string, string>();
const stockageSur: StateStorage = {
  getItem: (nom) => {
    try {
      return window.localStorage.getItem(nom) ?? memoire.get(nom) ?? null;
    } catch {
      return memoire.get(nom) ?? null;
    }
  },
  setItem: (nom, valeur) => {
    memoire.set(nom, valeur);
    try {
      window.localStorage.setItem(nom, valeur);
    } catch {
      /* stockage refusé : la mémoire suffit pour cette page */
    }
  },
  removeItem: (nom) => {
    memoire.delete(nom);
    try {
      window.localStorage.removeItem(nom);
    } catch {
      /* rien à faire */
    }
  },
};

interface RelanceSonState {
  sonCoupe: boolean;
  basculerSon: () => void;
}

/**
 * « Couper le son des relances », par NAVIGATEUR et non par compte : couper
 * le son sur le poste du bureau ne le coupe pas sur le téléphone. Le compteur
 * et les pastilles restent actifs son coupé.
 */
export const useRelanceSonStore = create<RelanceSonState>()(
  persist(
    (set) => ({
      sonCoupe: false,
      basculerSon: () => set((s) => ({ sonCoupe: !s.sonCoupe })),
    }),
    {
      name: CLE_REGLAGES_SON,
      storage: createJSONStorage(() => stockageSur),
      partialize: (s) => ({ sonCoupe: s.sonCoupe }),
    },
  ),
);
