import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { avisPriveAPI } from "../apis/avis-prive.api";
import type {
  AgentAvisDTO,
  AvisFiche,
  CommandeAvisDTO,
  JournalAvisDTO,
  StatutAvisDTO,
} from "../types/avis-prive.types";
import { messageErreurAvis } from "../utils/avis-prive";
import { avisKeys } from "./avis-prive.query";

/**
 * Gestes sur un avis. Chaque réponse est la fiche à jour : elle remplace le
 * cache de la fiche, puis liste et compteurs sont relus. Un conflit (409 :
 * un collègue a changé l'avis) affiche le message du serveur et recharge la
 * fiche.
 */
function useGesteAvis<V>(
  geste: (id: string, v: V) => Promise<AvisFiche>,
  succes: (fiche: AvisFiche, v: V) => string,
) {
  const queryClient = useQueryClient();
  const relire = () => queryClient.invalidateQueries({ queryKey: avisKeys.tout, exact: false });
  return useMutation({
    mutationFn: ({ id, valeur }: { id: string; valeur: V }) => geste(id, valeur),
    onSuccess: (fiche, { id, valeur }) => {
      queryClient.setQueryData(avisKeys.fiche(id), fiche);
      relire();
      toast.success(succes(fiche, valeur));
    },
    onError: (e) => {
      toast.error(messageErreurAvis(e));
      if ((e as { status?: number }).status === 409) relire();
    },
  });
}

export const useJournalAvisMutation = () =>
  useGesteAvis<JournalAvisDTO>((id, dto) => avisPriveAPI.journal(id, dto), () => "Ajouté au journal");

export const useStatutAvisMutation = () =>
  useGesteAvis<StatutAvisDTO>((id, dto) => avisPriveAPI.statut(id, dto), () => "Statut enregistré");

export const useCommandeAvisMutation = () =>
  useGesteAvis<CommandeAvisDTO>(
    (id, dto) => avisPriveAPI.commande(id, dto),
    (_f, dto) => (dto.order_id ? "Commande cochée" : "Commande décochée"),
  );

export const useAgentAvisMutation = () =>
  useGesteAvis<AgentAvisDTO>((id, dto) => avisPriveAPI.agent(id, dto), () => "Agent enregistré");

/** Suppression (administrateur) : le contenu personnel est effacé, l'avis quitte toutes les listes. */
export const useSupprimerAvisMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => avisPriveAPI.supprimer(id),
    onSuccess: (_r, id) => {
      queryClient.removeQueries({ queryKey: avisKeys.fiche(id) });
      queryClient.invalidateQueries({ queryKey: avisKeys.tout, exact: false });
      toast.success("Avis supprimé");
    },
    onError: (e) => toast.error(messageErreurAvis(e)),
  });
};
