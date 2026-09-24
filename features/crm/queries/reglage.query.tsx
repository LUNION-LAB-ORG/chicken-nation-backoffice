import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { reglageAPI } from "../apis/reglage.api";
import { IOffreDTO, IRaisonDTO, IReglages, IStatutAppelDTO } from "../types/reglage.type";
import { crmKeyQuery, useInvalidateCrmQuery } from "./index.query";

export const useStatutsAppelQuery = () =>
  useQuery({ queryKey: crmKeyQuery("statuts"), queryFn: reglageAPI.statuts.obtenirTous, staleTime: 5 * 60_000 });

export const useRaisonsQuery = () =>
  useQuery({ queryKey: crmKeyQuery("raisons"), queryFn: reglageAPI.raisons.obtenirTous, staleTime: 5 * 60_000 });

export const useOffresQuery = () =>
  useQuery({ queryKey: crmKeyQuery("offres"), queryFn: reglageAPI.offres.obtenirTous, staleTime: 5 * 60_000 });

export const useReglagesQuery = () =>
  useQuery({ queryKey: crmKeyQuery("reglages"), queryFn: reglageAPI.lire });

type Liste = "statuts" | "raisons" | "offres";
type DTO = IStatutAppelDTO | IRaisonDTO | IOffreDTO;
type Action =
  | { type: "ajouter"; dto: DTO }
  | { type: "modifier"; id: string; dto: DTO }
  | { type: "supprimer"; id: string }
  | { type: "reordonner"; ids: string[] };

const MESSAGES: Record<Action["type"], string> = {
  ajouter: "Ajouté",
  modifier: "Enregistré",
  supprimer: "Retiré de la liste",
  reordonner: "Ordre enregistré",
};

/** Une seule mutation par liste : ajouter, modifier, retirer, réordonner. */
export const useListeMutation = (liste: Liste) => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: (a: Action) => {
      const api = reglageAPI[liste] as unknown as {
        ajouter: (dto: DTO) => Promise<unknown>;
        modifier: (id: string, dto: DTO) => Promise<unknown>;
        supprimer: (id: string) => Promise<unknown>;
        reordonner: (ids: string[]) => Promise<unknown>;
      };
      if (a.type === "ajouter") return api.ajouter(a.dto);
      if (a.type === "modifier") return api.modifier(a.id, a.dto);
      if (a.type === "supprimer") return api.supprimer(a.id);
      return api.reordonner(a.ids);
    },
    onSuccess: (_, a) => {
      invalider(liste);
      if (a.type !== "reordonner") toast.success(MESSAGES[a.type]);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useReglagesMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: (dto: Partial<IReglages>) => reglageAPI.modifier(dto),
    onSuccess: () => {
      invalider("reglages");
      toast.success("Réglages enregistrés");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
