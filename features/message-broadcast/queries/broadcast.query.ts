import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { diffusionAPI } from '../apis/broadcast.api';
import type { ICreerDiffusion } from '../types/broadcast.type';

export const diffusionKey = (...parties: unknown[]) => ['diffusions', ...parties];

/**
 * Liste des diffusions.
 *
 * Se rafraîchit toutes les 5 secondes TANT QU'UNE DIFFUSION PART, et s'arrête
 * dès qu'elles sont toutes terminées. Sans cela, les compteurs d'envoi restent
 * figés à l'écran et le gestionnaire ne voit pas que ça avance.
 */
export const useDiffusionsQuery = (status?: string) =>
  useQuery({
    queryKey: diffusionKey('list', status ?? 'tous'),
    queryFn: () => diffusionAPI.lister(status),
    staleTime: 30 * 1000,
    refetchInterval: (query) =>
      query.state.data?.data?.some((d) => d.status === 'sending') ? 5000 : false,
  });

/**
 * Suivi d'une diffusion. Rafraîchi toutes les 5 secondes TANT QU'ELLE PART :
 * les compteurs bougent pendant l'envoi, et le gestionnaire a besoin de voir
 * que ça avance. On s'arrête dès qu'elle est terminée.
 */
export const useDiffusionQuery = (id?: string) =>
  useQuery({
    queryKey: diffusionKey('detail', id),
    queryFn: () => diffusionAPI.detail(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'sending' ? 5000 : false,
  });

export const useApercuAudienceMutation = () =>
  useMutation({
    mutationFn: ({
      target_type,
      target_config,
    }: {
      target_type: string;
      target_config: Record<string, any>;
    }) => diffusionAPI.apercu(target_type, target_config),
  });

export const useCreerDiffusionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreerDiffusion) => diffusionAPI.creer(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: diffusionKey('list'), exact: false });
      toast.success('Diffusion créée');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useEnvoyerDiffusionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => diffusionAPI.envoyer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: diffusionKey(), exact: false });
      toast.success("L'envoi a commencé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useReprendreDiffusionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => diffusionAPI.reprendre(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: diffusionKey(), exact: false });
      toast.success('Reprise lancée');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/**
 * Recherche de clients pour la sélection personnalisée.
 *
 * Ne cherche qu'à partir de deux caractères : le serveur refuse en deçà, et
 * lancer une requête à chaque lettre pour rien est un gaspillage.
 */
export const useRechercheClientsQuery = (terme: string) =>
  useQuery({
    queryKey: diffusionKey('clients', terme),
    queryFn: () => diffusionAPI.chercherClients(terme),
    enabled: terme.trim().length >= 2,
    staleTime: 60 * 1000,
  });
