import { api } from "@/services/api";
import {
  GroupeRelance,
  IgnoreesReponse,
  IgnorerRelanceDTO,
  RelancesReponse,
} from "../types/relance.types";

const BASE = "/orders/relances";

/**
 * Le client HTTP commun remplace tout 404 par « Ressource non trouvée ». Ici
 * un 404 veut toujours dire la même chose (commande inconnue ou hors de son
 * restaurant) : on rend le texte du serveur, sans le statut perdu.
 */
const avecIntrouvable = async <T>(requete: Promise<T>): Promise<T> => {
  try {
    return await requete;
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 404) throw Object.assign(new Error("Commande introuvable."), { status });
    throw e;
  }
};

const chemin = (orderId: string, action: string) => `${BASE}/${encodeURIComponent(orderId)}/${action}`;

export const relanceAPI = {
  /** Tous les restaurants du périmètre du compte : l'écran filtre lui-même par restaurant. */
  lister: () => api.get<RelancesReponse>(BASE),

  /** Ignorées depuis 24 h, toutes équipes confondues. */
  listerIgnorees: () => api.get<IgnoreesReponse>(`${BASE}/ignorees`),

  /** « Je m'en occupe » : 409 si un collègue a été plus rapide. */
  prendre: (orderId: string) =>
    avecIntrouvable(api.post<{ groupe: GroupeRelance }>(chemin(orderId, "prendre"), {})),

  liberer: (orderId: string) => avecIntrouvable(api.post<{ ok: true }>(chemin(orderId, "liberer"), {})),

  ignorer: (orderId: string, dto: IgnorerRelanceDTO) =>
    avecIntrouvable(api.post<{ ok: true; nombre: number }>(chemin(orderId, "ignorer"), dto)),

  retablir: (orderId: string) =>
    avecIntrouvable(api.post<{ ok: true; hors_fenetre: boolean }>(chemin(orderId, "retablir"), {})),
};
