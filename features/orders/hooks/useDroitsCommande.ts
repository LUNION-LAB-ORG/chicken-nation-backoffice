import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";
import type { DroitsCommande } from "../utils/order-actions-rules";

/**
 * Droits de l'utilisateur connecté sur les commandes, pour `actionsCommande()`.
 *
 * Un sélecteur par droit, chacun rendant un booléen : comme `HasPermission`,
 * le composant se redessine quand les droits sont relus.
 */
export const useDroitsCommande = (): DroitsCommande => {
  const role = useAuthStore((s) => s.user?.role);
  const peutLire = useAuthStore((s) => s.can(Modules.COMMANDES, Action.READ));
  const peutChangerStatut = useAuthStore((s) => s.can(Modules.COMMANDES, Action.UPDATE));
  const peutModifier = useAuthStore((s) => s.can(Modules.COMMANDES, Action.UPDATE_FULL));
  const peutSupprimer = useAuthStore((s) => s.can(Modules.COMMANDES, Action.DELETE));
  return { role, peutLire, peutChangerStatut, peutModifier, peutSupprimer };
};
