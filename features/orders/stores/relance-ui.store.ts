import { create } from "zustand";

interface RelanceUiState {
  /** Le navigateur a refusé de jouer le son (aucun geste depuis le chargement). */
  sonBloque: boolean;
  /** Avance de l'horloge du serveur sur celle du poste, en millisecondes. */
  ecartHorloge: number;
  setSonBloque: (bloque: boolean) => void;
  setEcartHorloge: (ecart: number) => void;
}

/**
 * État d'écran de la relance, propre à cet onglet du navigateur. Rien n'est
 * persisté : au rechargement, le son se réessaie et l'horloge se recale.
 */
export const useRelanceUiStore = create<RelanceUiState>((set) => ({
  sonBloque: false,
  ecartHorloge: 0,
  setSonBloque: (sonBloque) => set({ sonBloque }),
  setEcartHorloge: (ecartHorloge) => set({ ecartHorloge }),
}));
