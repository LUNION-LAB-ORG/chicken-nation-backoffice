import { create } from "zustand";
import type { DemandeSignalement } from "../types/incident.types";

/**
 * Ce que la page montre des incidents, quel que soit l'écran : la fiche
 * ouverte et la fenêtre « Signaler un incident ». Les deux s'ouvrent
 * PAR-DESSUS l'écran en cours (tiroir d'une commande, ticket, avis, CRM) :
 * personne ne quitte ce qu'il faisait pour signaler ou traiter.
 *
 * Rien n'est mémorisé d'une session à l'autre.
 */
interface EtatIncidents {
  ficheId: string | null;
  signalement: DemandeSignalement | null;
  ouvrirFiche: (id: string) => void;
  fermerFiche: () => void;
  signaler: (demande?: DemandeSignalement) => void;
  fermerSignalement: () => void;
}

export const useIncidentsUi = create<EtatIncidents>((set) => ({
  ficheId: null,
  signalement: null,
  ouvrirFiche: (id) => set({ ficheId: id }),
  fermerFiche: () => set({ ficheId: null }),
  signaler: (demande) => set({ signalement: demande ?? {} }),
  fermerSignalement: () => set({ signalement: null }),
}));
