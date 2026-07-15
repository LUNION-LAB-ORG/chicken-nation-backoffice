import { keepPreviousData, useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { scratchKeyQuery } from "./index.query";
import {
  getScratchEnvelope,
  getScratchLot,
  getScratchLots,
  simulateScratch,
} from "../services/scratch.service";
import { ScratchSimulateQuery } from "../types/scratch.types";

// Liste des lots (plancher en tête)
export const useScratchLotsQuery = () => {
  const result = useQuery({
    queryKey: scratchKeyQuery("lots"),
    queryFn: getScratchLots,
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

// Détail d'un lot
export const scratchLotQueryOption = (id: string) => ({
  queryKey: scratchKeyQuery("lot", id),
  queryFn: () => getScratchLot(id),
  enabled: !!id,
  staleTime: 5 * 60 * 1000,
});

export const useScratchLotQuery = (id: string) => {
  const result = useQuery(scratchLotQueryOption(id));
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

// Simulateur — calibrage avant activation
export const useScratchSimulateQuery = (
  query: ScratchSimulateQuery,
  enabled = true
) => {
  return useQuery({
    queryKey: scratchKeyQuery("simulate", query.amount, query.level ?? "ALL"),
    queryFn: () => simulateScratch(query),
    enabled: enabled && query.amount > 0,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
};

// Moniteur d'enveloppe
export const useScratchEnvelopeQuery = () => {
  const result = useQuery({
    queryKey: scratchKeyQuery("envelope"),
    queryFn: getScratchEnvelope,
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
