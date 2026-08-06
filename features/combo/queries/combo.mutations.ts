import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useInvalidateComboQuery } from "./index.query";
import {
  createComboGame,
  deleteComboGame,
  drawComboWinners,
  updateComboGame,
} from "../services/combo.service";
import {
  CreateComboGameDto,
  UpdateComboGameDto,
} from "../types/combo.types";

// Créer un jeu Combo
export const useCreateComboGameMutation = () => {
  const invalidate = useInvalidateComboQuery();

  return useMutation({
    mutationFn: (data: CreateComboGameDto) => createComboGame(data),
    onSuccess: () => {
      invalidate("games");
      toast.success("Jeu créé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Mettre à jour un jeu Combo
export const useUpdateComboGameMutation = () => {
  const invalidate = useInvalidateComboQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateComboGameDto }) =>
      updateComboGame(id, data),
    onSuccess: (_, variables) => {
      invalidate("games");
      invalidate("game", variables.id);
      toast.success("Jeu mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Supprimer (ou désactiver) un jeu Combo
export const useDeleteComboGameMutation = () => {
  const invalidate = useInvalidateComboQuery();

  return useMutation({
    mutationFn: (id: string) => deleteComboGame(id),
    onSuccess: () => {
      invalidate("games");
      toast.success("Jeu Combo supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Déclencher le tirage au sort des gagnants
export const useDrawComboWinnersMutation = () => {
  const invalidate = useInvalidateComboQuery();

  return useMutation({
    mutationFn: (gameId: string) => drawComboWinners(gameId),
    onSuccess: (result, gameId) => {
      invalidate("games");
      invalidate("game", gameId);
      invalidate("winners", gameId);
      invalidate("participations", gameId);
      toast.success(
        `Tirage effectué : ${result.drawn_count} gagnant(s) désigné(s)`
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
