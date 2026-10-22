import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import type { Course } from '../../courses/types/course.types';
import { useRestaurantCodeRetrait } from '../hooks/use-restaurant-code-retrait';
import { validatePickup } from '../services/operations-service';
import { restaurantPourValidation } from '../utils/code-retrait';
import { useInvalidateOperationsQuery } from './index.query';

/**
 * Mutation caissière : valide la récupération d'une course par le livreur.
 * Cascade backend : Course → IN_DELIVERY, Orders → PICKED_UP, timestamps propagés.
 *
 * Reçoit la course de l'aperçu : son code part avec le restaurant de la
 * recherche, ou celui de la course sur « Tous les restaurants »
 * (`restaurantPourValidation`).
 */
export const useValidatePickupMutation = () => {
  const invalidate = useInvalidateOperationsQuery();
  const restaurantRecherche = useRestaurantCodeRetrait();

  return useMutation({
    mutationFn: (course: Pick<Course, 'pickup_code' | 'restaurant_id'>) =>
      validatePickup(course.pickup_code, restaurantPourValidation(restaurantRecherche, course)),
    onSuccess: async () => {
      await invalidate();
      toast.success('Course validée : le livreur peut partir en livraison');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
