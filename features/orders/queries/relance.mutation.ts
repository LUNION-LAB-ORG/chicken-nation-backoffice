import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { relanceAPI } from "../apis/relance.api";
import { IgnorerRelanceDTO, RelancesReponse } from "../types/relance.types";
import { reglesDe, sansPointFinal } from "../utils/relance";
import { RELANCES_CLE, useInvalidateRelances } from "./relance.query";

type ErreurApi = Error & { status?: number };

/**
 * « Je m'en occupe ». Un collègue plus rapide l'a déjà prise, ou le client
 * vient de payer : la liste est relue et le message du serveur dit quoi faire.
 *
 * `silencieux` : la reprise au téléphone enchaîne sur son propre message.
 */
export const usePrendreRelance = () => {
  const invalider = useInvalidateRelances();
  return useMutation({
    mutationFn: ({ orderId }: { orderId: string; reference: string; silencieux?: boolean }) =>
      relanceAPI.prendre(orderId),
    onSuccess: (_r, { reference, silencieux }) => {
      void invalider();
      if (!silencieux) toast.success(`Vous vous occupez de ${reference} : appelez le client.`);
    },
    onError: (e: ErreurApi) => {
      // Le conseil ne vaut que pour un collègue plus rapide : les autres refus
      // (paiement en cours, commande ignorée, sortie) disent déjà quoi faire.
      const collegue = e.status === 409 && e.message?.startsWith("Déjà prise par");
      toast.error(collegue ? `${sansPointFinal(e.message)}. Passez à la suivante.` : e.message);
      void invalider();
    },
  });
};

export const useLibererRelance = () => {
  const invalider = useInvalidateRelances();
  return useMutation({
    mutationFn: (orderId: string) => relanceAPI.liberer(orderId),
    onSuccess: () => {
      void invalider();
      toast.success("Commande libérée");
    },
    onError: (e: ErreurApi) => {
      toast.error(e.message);
      void invalider();
    },
  });
};

export const useIgnorerRelance = () => {
  const invalider = useInvalidateRelances();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: IgnorerRelanceDTO }) => relanceAPI.ignorer(orderId, dto),
    onSuccess: () => {
      void invalider();
      toast.success("Commande ignorée pour toute l'équipe");
    },
    onError: (e: ErreurApi) => {
      toast.error(e.message);
      void invalider();
    },
  });
};

export const useRetablirRelance = () => {
  const invalider = useInvalidateRelances();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => relanceAPI.retablir(orderId),
    onSuccess: (r) => {
      void invalider();
      if (r?.hors_fenetre) {
        const { fenetre_heures } = reglesDe(queryClient.getQueryData<RelancesReponse>(RELANCES_CLE));
        toast(`Commande rétablie, mais elle a plus de ${fenetre_heures} h : elle ne sera plus alertée.`, {
          icon: "ℹ️",
          duration: 6000,
        });
      } else {
        toast.success("Commande rétablie dans les relances");
      }
    },
    onError: (e: ErreurApi) => {
      toast.error(e.message);
      void invalider();
    },
  });
};
