// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { OrderStatus } from '../../types/order.types';
import { UserRole } from '../../../users/types/user.types';
import { peutModifierCommande } from '../modification-commande';
import { actionsCommande, statutPermetModification } from '../order-actions-rules';
// Le jumeau côté serveur, lu tel quel : la comparaison porte sur le vrai code.
import { peutModifierCommande as peutModifierCommandeServeur } from '../../../../../backend/src/modules/order/helpers/modification-commande.rules';

const STATUTS = Object.values(OrderStatus);
const ROLES = Object.values(UserRole);

describe('modification d’une commande : écran et serveur alignés', () => {
  test('8 statuts et 8 rôles couverts', () => {
    expect(STATUTS).toHaveLength(8);
    expect(ROLES).toHaveLength(8);
  });

  test('même réponse que le serveur pour chaque rôle et chaque statut', () => {
    for (const role of [...ROLES, undefined]) {
      for (const statut of [...STATUTS, undefined]) {
        const serveur = peutModifierCommandeServeur(role, statut);
        expect({ role, statut, ecran: peutModifierCommande(role, statut) }).toEqual({ role, statut, ecran: serveur });
        expect({ role, statut, ecran: statutPermetModification(statut, role) }).toEqual({ role, statut, ecran: serveur });
      }
    }
  });

  test('en livraison : modifiable par l’administrateur seulement', () => {
    for (const role of ROLES) {
      expect(statutPermetModification(OrderStatus.PICKED_UP, role)).toBe(role === UserRole.ADMIN);
    }
  });

  test('annulée : administrateur et centre d’appels seulement', () => {
    const permis = ROLES.filter((r) => statutPermetModification(OrderStatus.CANCELLED, r));
    expect(permis.sort()).toEqual([UserRole.ADMIN, UserRole.CALL_CENTER].sort());
  });

  test('« Modifier » absent du menu sur une commande en livraison hors administrateur', () => {
    const droits = { role: UserRole.CALL_CENTER, peutLire: true, peutChangerStatut: true, peutModifier: true, peutSupprimer: false };
    expect(actionsCommande(OrderStatus.PICKED_UP, droits, 'liste')).not.toContain('modifier');
    expect(actionsCommande(OrderStatus.PICKED_UP, droits, 'tiroir')).not.toContain('modifier');
    expect(actionsCommande(OrderStatus.CANCELLED, droits, 'tiroir')).toContain('modifier');
    expect(actionsCommande(OrderStatus.READY, droits, 'liste')).toContain('modifier');
  });
});
