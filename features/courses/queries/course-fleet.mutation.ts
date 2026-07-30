import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import {
  basculerCourseVersTurbo,
  relancerCourseAnnulee,
  reprendreCourseEnInterne,
} from '../services/course.service';
import { useInvalidateOrderQuery } from '../../orders/queries/index.query';
import { useInvalidateCourseQuery } from './index.query';

/**
 * Confie manuellement une course à la flotte externe Turbo.
 *
 * La bascule automatique attend un délai configuré ; ce bouton permet au staff
 * de trancher tout de suite lorsqu'il sait qu'aucun livreur interne ne se
 * libérera (fin de service, pic d'activité).
 */
export const useCourseVersTurboMutation = () => {
  const invalidate = useInvalidateCourseQuery();

  return useMutation({
    mutationFn: (id: string) => basculerCourseVersTurbo(id),
    onSuccess: async (r) => {
      await invalidate();
      // Le serveur peut refuser sans erreur HTTP (Turbo injoignable, course
      // déjà confiée) : on relaie son message tel quel plutôt qu'un faux succès.
      if (r?.success) toast.success(r.message);
      else toast.error(r?.message ?? 'Bascule impossible');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/**
 * Reprend une course confiée à Turbo pour la reproposer aux livreurs internes.
 * Le serveur refuse si un livreur Turbo est déjà affecté.
 */
export const useCourseVersInterneMutation = () => {
  const invalidate = useInvalidateCourseQuery();

  return useMutation({
    mutationFn: (id: string) => reprendreCourseEnInterne(id),
    onSuccess: async (r) => {
      await invalidate();
      if (r?.success) toast.success(r.message);
      else toast.error(r?.message ?? 'Reprise impossible');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/**
 * Relance une course ANNULÉE (typiquement par Turbo) : nouvelle course avec les
 * commandes encore actives, référence NEUVE (une referenceCourse déjà envoyée
 * à Turbo n'est jamais réutilisée — leur déduplication l'ignorerait en silence).
 */
export const useCourseRelancerMutation = () => {
  const invalidate = useInvalidateCourseQuery();
  const invalidateOrders = useInvalidateOrderQuery();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => relancerCourseAnnulee(id),
    onSuccess: async (r) => {
      // La relance déplace la livraison sur une NOUVELLE course : la bannière
      // « annulée par Turbo » du détail commande doit disparaître tout de
      // suite — on invalide donc aussi commandes + opérations, pas que les
      // courses.
      await Promise.all([
        invalidate(),
        invalidateOrders(),
        queryClient.invalidateQueries({ queryKey: ['operations'] }),
      ]);
      if (r?.success) toast.success(r.message);
      else toast.error(r?.message ?? 'Relance impossible');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
