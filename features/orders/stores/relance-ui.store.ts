import { create } from "zustand";

interface RelanceUiState {
  /** L'onglet « À relancer » est à l'écran : le bandeau global s'efface. */
  ongletVisible: boolean;
  /** Le navigateur a refusé de jouer le son (aucun geste depuis le chargement). */
  sonBloque: boolean;
  /** Avance de l'horloge du serveur sur celle du poste, en millisecondes. */
  ecartHorloge: number;
  setOngletVisible: (visible: boolean) => void;
  setSonBloque: (bloque: boolean) => void;
  setEcartHorloge: (ecart: number) => void;
}

/**
 * État d'écran de la relance, propre à cet onglet du navigateur. Rien n'est
 * persisté : au rechargement, le son se réessaie et l'horloge se recale.
 */
export const useRelanceUiStore = create<RelanceUiState>((set) => ({
  ongletVisible: false,
  sonBloque: false,
  ecartHorloge: 0,
  setOngletVisible: (ongletVisible) => set({ ongletVisible }),
  setSonBloque: (sonBloque) => set({ sonBloque }),
  setEcartHorloge: (ecartHorloge) => set({ ecartHorloge }),
}));
