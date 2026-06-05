import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import {
  getProspectSettings,
  updateProspectSettings,
} from "../services/prospect.service";
import { ProspectSettings } from "../types/prospect.types";
import { prospectKeyQuery } from "./index.query";

export const useProspectSettingsQuery = () =>
  useQuery({
    queryKey: prospectKeyQuery("settings"),
    queryFn: getProspectSettings,
    staleTime: 60 * 1000,
  });

export const useUpdateProspectSettingsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProspectSettings>) =>
      updateProspectSettings(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: prospectKeyQuery("settings") });
      toast.success("Réglages enregistrés");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
