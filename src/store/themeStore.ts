import { create } from "zustand";
import { CLE_THEME, ChoixTheme, estSombre, lireChoixTheme, THEME_PAR_DEFAUT } from "@/utils/theme";

const systemeSombre = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

/** Pose ou retire la classe `dark` sur <html>. */
export const appliquerTheme = (choix: ChoixTheme): void => {
  if (typeof document === "undefined") return;
  const racine = document.documentElement;
  const sombre = estSombre(choix, systemeSombre());
  if (racine.classList.contains("dark") === sombre) return;
  // Bascule nette : sans cela, chaque carte animée passe en fondu.
  racine.classList.add("sans-transition");
  racine.classList.toggle("dark", sombre);
  window.setTimeout(() => racine.classList.remove("sans-transition"), 50);
};

const lireMemorise = (): ChoixTheme => {
  try {
    return lireChoixTheme(window.localStorage.getItem(CLE_THEME));
  } catch {
    return THEME_PAR_DEFAUT;
  }
};

interface ThemeState {
  choix: ChoixTheme;
  /** Relit le choix mémorisé (au montage, ou quand un autre onglet le change). */
  synchroniser: () => void;
  choisir: (choix: ChoixTheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  choix: THEME_PAR_DEFAUT,
  synchroniser: () => {
    const choix = lireMemorise();
    appliquerTheme(choix);
    set({ choix });
  },
  choisir: (choix) => {
    try {
      window.localStorage.setItem(CLE_THEME, choix);
    } catch {
      // Navigation privée ou stockage bloqué : le choix vaut pour cette page.
    }
    appliquerTheme(choix);
    set({ choix });
  },
}));
