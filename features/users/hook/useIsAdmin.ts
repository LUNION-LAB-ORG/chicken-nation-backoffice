import { useAuthStore } from "./authStore";
import { UserRole } from "../types/user.types";

/**
 * Renvoie `true` si l'utilisateur connecté a le rôle ADMIN.
 *
 * À utiliser pour les actions qui doivent rester accessibles à l'admin
 * indépendamment du module/action de permission (ex: modifier une commande
 * quel que soit son statut, modifier un paiement déjà enregistré, etc.).
 *
 * Pour un contrôle d'accès basé sur module+action, préférer `HasPermission`
 * ou `useAuthStore((s) => s.can(...))`.
 */
export const useIsAdmin = (): boolean => {
  return useAuthStore((s) => s.user?.role === UserRole.ADMIN);
};
