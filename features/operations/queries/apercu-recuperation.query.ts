import { useQuery } from '@tanstack/react-query';

import { apercuRecuperation, type CourseARemettre } from '../services/operations-service';
import { operationsKeyQuery } from './index.query';

/**
 * Course à remettre, lue à l'ouverture de la fenêtre de récupération
 * (`GET /courses/operations/:id`). Serveur pas encore à jour (404 de route) :
 * l'ancienne route à code, avec le code et le restaurant de la course déjà à
 * l'écran (`apercuRecuperation`).
 *
 * Relue à chaque ouverture (rien en cache) ; un refus (404 « Course
 * introuvable. », 409…) n'est pas relancé : son texte s'affiche dans la
 * fenêtre.
 */
export const useApercuRecuperationQuery = (course: CourseARemettre | null, actif = true) =>
  useQuery({
    queryKey: operationsKeyQuery('recuperation', course?.id ?? null),
    queryFn: () => apercuRecuperation(course as CourseARemettre),
    enabled: actif && !!course?.id,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
