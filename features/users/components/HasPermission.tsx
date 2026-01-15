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
  const can = useAuthStore((state) => state.can);

  if (!can(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
