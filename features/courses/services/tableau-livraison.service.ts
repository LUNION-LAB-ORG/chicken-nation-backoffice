import { api } from '@/services/api';

import type { TableauLivraison } from '../types/tableau-livraison.types';

/**
 * `GET /livraison/tableau` (conception du 24/10, 11.4), sans paramètre : le
 * serveur choisit le périmètre (tous les restaurants pour le siège, le sien
 * pour un compte de restaurant). L'erreur garde son statut (`status`) : un
 * 404 veut dire que le serveur n'a pas encore la route.
 */
export const getTableauLivraison = () => api.get<TableauLivraison>('/livraison/tableau', true);
