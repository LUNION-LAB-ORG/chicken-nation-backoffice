"use client";

import { useEffect } from "react";
import { CLE_THEME } from "@/utils/theme";
import { appliquerTheme, useThemeStore } from "@/store/themeStore";

/**
 * Garde le thème à jour pendant que la page est ouverte : choix fait dans un
 * autre onglet, et réglage de l'appareil qui change (thème « Système »,
 * passage automatique au sombre le soir). Ne rend rien.
 */
export default function ThemeSync() {
  const synchroniser = useThemeStore((s) => s.synchroniser);

  useEffect(() => {
    synchroniser();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const surSysteme = () => appliquerTheme(useThemeStore.getState().choix);
    const surStockage = (e: StorageEvent) => {
      if (e.key === CLE_THEME) synchroniser();
    };
    media.addEventListener("change", surSysteme);
    window.addEventListener("storage", surStockage);
    return () => {
      media.removeEventListener("change", surSysteme);
      window.removeEventListener("storage", surStockage);
    };
  }, [synchroniser]);

  return null;
}
