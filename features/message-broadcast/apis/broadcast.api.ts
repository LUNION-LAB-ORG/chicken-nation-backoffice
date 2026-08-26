import { apiRequest } from '../../../src/services/api';
import type { ICreerDiffusion, IDiffusion } from '../types/broadcast.type';

const BASE = '/message-broadcasts';

export const diffusionAPI = {
  lister: (status?: string): Promise<{ data: IDiffusion[]; meta: { total: number } }> =>
    apiRequest(`${BASE}${status ? `?status=${status}` : ''}`, 'GET'),

  detail: (id: string): Promise<IDiffusion> => apiRequest(`${BASE}/${id}`, 'GET'),

  /**
   * Combien de clients ce ciblage désigne-t-il, sans rien écrire.
   *
   * ⚠️ Ne PAS utiliser le compteur de segments du module des notifications :
   * il compte à travers les jetons Expo et afficherait un effectif amputé de
   * tous les clients sans application installée, qui reçoivent pourtant très
   * bien un message.
   */
  apercu: (
    target_type: string,
    target_config: Record<string, any>,
  ): Promise<{ total: number }> =>
    apiRequest(`${BASE}/apercu`, 'POST', { target_type, target_config }),

  creer: (data: ICreerDiffusion): Promise<IDiffusion> => apiRequest(BASE, 'POST', data),

  envoyer: (id: string): Promise<IDiffusion> => apiRequest(`${BASE}/${id}/envoyer`, 'POST'),

  /** Reprend une diffusion interrompue. Ne renvoie rien à qui a déjà reçu. */
  reprendre: (id: string): Promise<IDiffusion> => apiRequest(`${BASE}/${id}/reprendre`, 'POST'),
};
