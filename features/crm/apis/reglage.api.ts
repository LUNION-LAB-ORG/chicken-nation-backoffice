import { api } from "@/services/api";
import { IOffre, IOffreDTO, IRaison, IRaisonDTO, IReglages, IStatutAppel, IStatutAppelDTO } from "../types/reglage.type";

const BASE = "/crm";

/** Une liste configurable : même forme pour les statuts d'appel, les raisons et les offres. */
function liste<T, DTO>(chemin: string) {
  return {
    obtenirTous: () => api.get<T[]>(`${BASE}/${chemin}`),
    ajouter: (dto: DTO) => api.post<T>(`${BASE}/${chemin}`, dto),
    modifier: (id: string, dto: DTO) => api.patch<T>(`${BASE}/${chemin}/${id}`, dto),
    supprimer: (id: string) => api.delete<T>(`${BASE}/${chemin}/${id}`),
    reordonner: (ids: string[]) => api.patch<T[]>(`${BASE}/${chemin}/reorder`, { ids }),
  };
}

export const reglageAPI = {
  statuts: liste<IStatutAppel, IStatutAppelDTO>("call-statuses"),
  raisons: liste<IRaison, IRaisonDTO>("reasons"),
  offres: liste<IOffre, IOffreDTO>("offers"),
  lire: () => api.get<IReglages>(`${BASE}/settings`),
  modifier: (dto: Partial<IReglages>) => api.patch<IReglages>(`${BASE}/settings`, dto),
};
