import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";
import { UserType } from "../../users/types/user.types";

/**
 * Compte de point de vente (User.type RESTAURANT, le manager) : le serveur
 * limite ses listes, ses fiches et ses tableaux de bord aux clients de SON
 * restaurant, et lui refuse les campagnes (elles se consultent au siège).
 * L'écran n'en demande donc aucune et ne propose pas de choisir un restaurant.
 */
export const usePointDeVente = () => useAuthStore((s) => s.user?.type === UserType.RESTAURANT);

/**
 * Ce que le compte peut faire dans le CRM (cahier §9, revu le 25/09), mêmes
 * règles que le serveur. Sélecteurs booléens : l'écran se redessine dès que
 * les droits relus changent.
 *  - gestionnaire (CREATE) : tout ;
 *  - agent (UPDATE) : sa file, ses contacts, la file commune ;
 *  - lecteur (READ sans UPDATE ni CREATE : marketing, manager) : voit tout,
 *    téléphones compris, sans aucun geste ni export.
 */
export function useDroitsCrm() {
  const peutLire = useAuthStore((s) => s.can(Modules.CRM, Action.READ));
  const estGestionnaire = useAuthStore((s) => s.can(Modules.CRM, Action.CREATE));
  const peutTraiter = useAuthStore((s) => s.can(Modules.CRM, Action.UPDATE));
  const peutAnalyser = useAuthStore((s) => s.can(Modules.CRM, Action.REPORT));
  const peutExporter = useAuthStore((s) => s.can(Modules.CRM, Action.EXPORT));
  const peutVoirLeFichier = useAuthStore((s) => s.can(Modules.CLIENTS, Action.READ));
  const pointDeVente = usePointDeVente();
  const lecteur = peutLire && !peutTraiter && !estGestionnaire;
  /**
   * ANNUAIRE : le compte tient le fichier client (droit CLIENTS) sans aucun
   * droit CRM. Caissier et assistant-manager. Depuis la disparition de la
   * page Clients, ils entrent par le CRM et n'y voient que les contacts et la
   * fiche client. Le serveur applique la même règle et ampute la réponse : ce
   * qui suit ne fait que ne pas proposer ce qui serait de toute façon vide.
   */
  const annuaire = !peutLire && peutVoirLeFichier;
  return { peutLire, estGestionnaire, peutTraiter, peutAnalyser, peutExporter, lecteur, annuaire, pointDeVente };
}
