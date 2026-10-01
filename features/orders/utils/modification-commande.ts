import { OrderStatus } from "../types/order.types";
import { UserRole } from "../../users/types/user.types";

/**
 * QUI PEUT MODIFIER UNE COMMANDE, SELON SON STATUT (bouton « Modifier »).
 *
 * Doit rester identique à son jumeau de l'autre côté :
 * backend/src/modules/order/helpers/modification-commande.rules.ts
 * (garde de statut de `OrderService.update()`). Toute règle changée ici se
 * change là-bas ; le test `__tests__/modification-commande.test.ts` compare
 * les deux sur tous les statuts et tous les rôles.
 *
 * Le droit lui même (COMMANDES UPDATE_FULL) est vérifié à part, par
 * `actionsCommande()` : ces règles ne portent que sur le statut.
 *
 *  - Tout rôle qui a le droit modifie une commande en attente, acceptée, en
 *    préparation ou prête. PAS une commande en livraison (PICKED_UP) : le
 *    serveur la refuse.
 *  - Le CENTRE D'APPELS modifie AUSSI une commande annulée. Elle RESTE
 *    annulée : la modification ne la réactive jamais. Ni terminée, ni
 *    récupérée, ni en livraison.
 *  - L'ADMINISTRATEUR modifie une commande quel que soit son statut.
 */

/** Statuts modifiables par tout rôle qui a le droit de modifier une commande. */
export const STATUTS_MODIFIABLES: readonly OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.READY,
];

/** Rôles qui, en plus, modifient une commande annulée. L'administrateur passe partout. */
export const ROLES_MODIFIANT_UNE_COMMANDE_ANNULEE: readonly UserRole[] = [UserRole.CALL_CENTER];

type Role = UserRole | string | null | undefined;
type Statut = OrderStatus | string | null | undefined;

export function peutModifierCommande(role: Role, statut: Statut): boolean {
  if (role === UserRole.ADMIN) return true;
  if (!statut) return false;
  if ((STATUTS_MODIFIABLES as readonly string[]).includes(statut)) return true;
  return (
    statut === OrderStatus.CANCELLED &&
    !!role &&
    (ROLES_MODIFIANT_UNE_COMMANDE_ANNULEE as readonly string[]).includes(role)
  );
}
