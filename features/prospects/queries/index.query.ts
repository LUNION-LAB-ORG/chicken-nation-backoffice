import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Racine « conversion » : « prospect » est déjà prise par l'acquisition
 * Glovo/Yango, et partager la clé mélangerait les deux caches.
 */
export const conversionKeyQuery = (...params: unknown[]) => ["conversion", ...params];

/** Fonction stable : le temps réel s'y abonne sans se réabonner à chaque rendu. */
export const useInvalidateConversionQuery = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (...params: unknown[]) =>
      queryClient.invalidateQueries({ queryKey: conversionKeyQuery(...params), exact: false }),
    [queryClient],
  );
};
