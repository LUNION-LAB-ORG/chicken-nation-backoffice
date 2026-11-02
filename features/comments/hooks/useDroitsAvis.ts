import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";
import { UserType } from "../../users/types/user.types";
import { peutTraiterAvis } from "../utils/avis-prive";

/**
 * Ce que le compte peut faire sur les retours privés (contrat 4.3), mêmes
 * règles que le serveur. Un bouton n'apparaît que pour qui peut s'en servir.
 *  - lire : COMMENTAIRES READ (comme l'entrée de menu « Notes et avis ») ;
 *  - traiter : ADMIN et CALL_CENTER (liste de rôles du serveur) ;
 *  - exporter : COMMENTAIRES EXPORT ; supprimer : COMMENTAIRES DELETE ;
 *  - fiche CRM : CRM ou CLIENTS en lecture ;
 *  - point de vente : son restaurant seulement, pas de filtre Store.
 */
export function useDroitsAvis() {
  const peutLire = useAuthStore((s) => s.can(Modules.COMMENTAIRES, Action.READ));
  const peutExporter = useAuthStore((s) => s.can(Modules.COMMENTAIRES, Action.EXPORT));
  const peutSupprimer = useAuthStore((s) => s.can(Modules.COMMENTAIRES, Action.DELETE));
  const peutVoirCrm = useAuthStore((s) => s.can(Modules.CRM, Action.READ) || s.can(Modules.CLIENTS, Action.READ));
  const peutGererCrm = useAuthStore((s) => s.can(Modules.CRM, Action.CREATE));
  const peutVoirCommandes = useAuthStore((s) => s.can(Modules.COMMANDES, Action.READ));
  const peutVoirTickets = useAuthStore((s) => s.can(Modules.MESSAGES, Action.READ));
  const peutTraiter = useAuthStore((s) => peutTraiterAvis(s.user));
  const pointDeVente = useAuthStore((s) => s.user?.type === UserType.RESTAURANT);
  return {
    peutLire,
    peutTraiter,
    peutExporter,
    peutSupprimer,
    peutVoirCrm,
    peutGererCrm,
    peutVoirCommandes,
    peutVoirTickets,
    pointDeVente,
  };
}
