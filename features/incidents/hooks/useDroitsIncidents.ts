import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";
import { UserType } from "../../users/types/user.types";
import { estSiegeIncidents, peutReglerIncidents, peutSignalerIncident, peutVoirIncidents } from "../utils/incident";

/**
 * Ce que le compte peut faire des incidents AVANT toute lecture : montrer
 * l'onglet, le bouton « Signaler un incident », les réglages. Mêmes listes de
 * rôles que le serveur (`roles-incidents.ts`).
 *
 * Les gestes sur UN incident (prendre, résoudre, offrir un bon, clôturer,
 * rouvrir) ne se devinent pas ici : la fiche les porte dans `droits`.
 */
export function useDroitsIncidents() {
  const voir = useAuthStore((s) => peutVoirIncidents(s.user));
  const signaler = useAuthStore((s) => peutSignalerIncident(s.user));
  const siege = useAuthStore((s) => estSiegeIncidents(s.user));
  const regler = useAuthStore((s) => peutReglerIncidents(s.user));
  const pointDeVente = useAuthStore((s) => s.user?.type === UserType.RESTAURANT);
  const voirCommandes = useAuthStore((s) => s.can(Modules.COMMANDES, Action.READ));
  const voirTickets = useAuthStore((s) => s.can(Modules.MESSAGES, Action.READ));
  const voirAvis = useAuthStore((s) => s.can(Modules.COMMENTAIRES, Action.READ));
  return { voir, signaler, siege, regler, pointDeVente, voirCommandes, voirTickets, voirAvis, exporter: siege };
}
