'use client';

import { useAuthStore } from '../../users/hook/authStore';
import { droitsLivraison, type DroitsLivraison } from '../utils/droits-livraison';

/**
 * Droits du compte connecté sur En direct, Courses, Livreurs et Planning
 * (règle pure : `../utils/droits-livraison.ts`).
 *
 * `can` garde la même identité quand les droits sont relus
 * (GET /auth/permissions) : s'abonner aux permissions redessine l'écran avec
 * les droits à jour.
 */
export function useDroitsLivraison(): DroitsLivraison {
  const can = useAuthStore((s) => s.can);
  useAuthStore((s) => s.user?.permissions);
  const membre = useAuthStore((s) => s.user);
  return droitsLivraison({ can, membre });
}
