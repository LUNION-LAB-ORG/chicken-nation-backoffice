"use client";

import { ReactNode } from "react";
import { useAuthStore } from "../hook/authStore";
import { Action, Modules } from "../types/auth.type";

interface Props {
  module: Modules;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

export const HasPermission = ({
  module,
  action,
  children,
  fallback = null,
}: Props) => {
  // Le sélecteur rend un booléen : le composant se redessine quand les droits
  // sont relus (GET /auth/permissions), ce que `state.can` seul ne fait pas.
  const autorise = useAuthStore((state) => state.can(module, action));

  if (!autorise) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
