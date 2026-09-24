import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Racine « crm » : « prospect » est déjà prise par l'acquisition
 * Glovo/Yango, et partager la clé mélangerait les deux caches.
 */
export const crmKeyQuery = (...params: unknown[]) => ["crm", ...params];

/** Fonction stable : le temps réel s'y abonne sans se réabonner à chaque rendu. */
export const useInvalidateCrmQuery = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (...params: unknown[]) =>
      queryClient.invalidateQueries({ queryKey: crmKeyQuery(...params), exact: false }),
    [queryClient],
  );
};
