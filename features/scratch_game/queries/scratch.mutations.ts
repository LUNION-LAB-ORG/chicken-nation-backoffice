import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useInvalidateScratchQuery } from "./index.query";
import {
  createScratchLot,
  deleteScratchLot,
  updateScratchLot,
} from "../services/scratch.service";
import {
  CreateScratchLotDto,
  UpdateScratchLotDto,
} from "../types/scratch.types";

// Créer un lot
export const useCreateScratchLotMutation = () => {
  const invalidate = useInvalidateScratchQuery();

  return useMutation({
    mutationFn: (data: CreateScratchLotDto) => createScratchLot(data),
    onSuccess: () => {
      invalidate("lots");
      invalidate("simulate");
      invalidate("envelope");
      toast.success("Lot créé avec succès");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Mettre à jour un lot
export const useUpdateScratchLotMutation = () => {
  const invalidate = useInvalidateScratchQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScratchLotDto }) =>
      updateScratchLot(id, data),
    onSuccess: (_, variables) => {
      invalidate("lots");
      invalidate("lot", variables.id);
      invalidate("simulate");
      invalidate("envelope");
      toast.success("Lot mis à jour avec succès");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Supprimer (ou désactiver) un lot
export const useDeleteScratchLotMutation = () => {
  const invalidate = useInvalidateScratchQuery();

  return useMutation({
    mutationFn: (id: string) => deleteScratchLot(id),
    onSuccess: () => {
      invalidate("lots");
      invalidate("simulate");
      invalidate("envelope");
      toast.success("Lot supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
