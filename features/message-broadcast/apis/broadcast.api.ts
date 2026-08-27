import { apiRequest } from '../../../src/services/api';
import { getAuthToken } from '@/utils/authUtils';
import type {
  IApercuAudience,
  IClientCible,
  ICreerDiffusion,
  IDiffusion,
} from '../types/broadcast.type';

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
  ): Promise<IApercuAudience> =>
    apiRequest(`${BASE}/apercu`, 'POST', { target_type, target_config }),

  /** Recherche de clients pour la sélection personnalisée. */
  chercherClients: (search: string): Promise<{ data: IClientCible[] }> =>
    apiRequest(`${BASE}/clients?search=${encodeURIComponent(search)}`, 'GET'),

  /**
   * Création. En MULTIPART à cause de l'image jointe : le navigateur pose
   * lui-même la frontière, on ne fixe donc pas le Content-Type.
   */
  creer: async (data: ICreerDiffusion): Promise<IDiffusion> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentification requise');

    const form = new FormData();
    form.append('name', data.name);
    form.append('body', data.body);
    form.append('target_type', data.target_type);
    form.append('target_config', JSON.stringify(data.target_config));
    if (data.scheduled_at) form.append('scheduled_at', data.scheduled_at);
    if (data.image) form.append('image', data.image);

    const reponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_PREFIX}${BASE}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    );
    const json = await reponse.json().catch(() => ({}));
    if (!reponse.ok) {
      throw new Error(
        Array.isArray(json?.message) ? json.message.join(', ') : json?.message ||
          'Création impossible',
      );
    }
    return json as IDiffusion;
  },

  envoyer: (id: string): Promise<IDiffusion> => apiRequest(`${BASE}/${id}/envoyer`, 'POST'),

  /** Reprend une diffusion interrompue. Ne renvoie rien à qui a déjà reçu. */
  reprendre: (id: string): Promise<IDiffusion> => apiRequest(`${BASE}/${id}/reprendre`, 'POST'),
};
