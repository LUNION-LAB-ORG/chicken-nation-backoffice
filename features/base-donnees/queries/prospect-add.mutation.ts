import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { createProspect } from "../services/prospect.service";
import { CreateProspectPayload } from "../types/prospect.types";
import { useInvalidateProspectQuery } from "./index.query";

/**
 * Saisie d'un contact Glovo/Yango. Le toast de succès est volontairement
 * laissé à l'appelant (la capture caissier affiche un écran de confirmation).
 */
export const useProspectAddMutation = () => {
  const invalidate = useInvalidateProspectQuery();

  return useMutation({
    mutationFn: (payload: CreateProspectPayload) => createProspect(payload),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};
