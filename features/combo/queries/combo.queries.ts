import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { comboKeyQuery } from "./index.query";
import {
  getComboGame,
  getComboGames,
  getComboParticipations,
  getComboWinners,
} from "../services/combo.service";

// Liste des jeux Combo
export const useComboGamesQuery = () => {
  const result = useQuery({
    queryKey: comboKeyQuery("games"),
    queryFn: getComboGames,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : "Erreur de chargement"
      );
    }
  }, [result.isError, result.error]);
  return result;
};

// Détail d'un jeu Combo
export const comboGameQueryOption = (id: string) => ({
  queryKey: comboKeyQuery("game", id),
  queryFn: () => getComboGame(id),
  enabled: !!id,
  staleTime: 5 * 60 * 1000,
});

export const useComboGameQuery = (id: string) => {
  const result = useQuery(comboGameQueryOption(id));
  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : "Erreur de chargement"
      );
    }
  }, [result.isError, result.error]);
  return result;
};

// Participations d'un jeu (suivi)
export const useComboParticipationsQuery = (gameId: string, enabled = true) => {
  const result = useQuery({
    queryKey: comboKeyQuery("participations", gameId),
    queryFn: () => getComboParticipations(gameId),
    enabled: enabled && !!gameId,
    staleTime: 60 * 1000,
  });
  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : "Erreur de chargement"
      );
    }
  }, [result.isError, result.error]);
  return result;
};

// Gagnants tirés d'un jeu (suivi)
export const useComboWinnersQuery = (gameId: string, enabled = true) => {
  const result = useQuery({
    queryKey: comboKeyQuery("winners", gameId),
    queryFn: () => getComboWinners(gameId),
    enabled: enabled && !!gameId,
    staleTime: 60 * 1000,
  });
  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : "Erreur de chargement"
      );
    }
  }, [result.isError, result.error]);
  return result;
};
