import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { recupererCourse, type CourseARemettre } from '../services/operations-service';
import { texteRemiseValidee } from '../utils/remise-par-code';
import { useInvalidateOperationsQuery } from './index.query';

/**
 * « Confirmer la récupération » (caissière) : les commandes à remettre de la
 * fenêtre passent récupérées (`POST /courses/operations/:id/recuperation`) ;
 * serveur pas encore à jour : l'ancienne validation par code.
 *
 * Refus du serveur (commande repassée en cuisine, course qui a changé,
 * double confirmation) : rien ne se ferme, une notification rouge et la
 * fenêtre affichent son texte, la fenêtre relit la course ; la liste est
 * relue aussi.
 */
export const useConfirmerRecuperationMutation = () => {
  const invalidate = useInvalidateOperationsQuery();

  return useMutation({
    mutationFn: ({ course, orderIds }: { course: CourseARemettre; orderIds: string[]; statut: string }) =>
      recupererCourse(course, orderIds),
    // Pas d'attente de la relecture : la fenêtre se ferme tout de suite, sans
    // montrer l'aperçu relu d'une course qui n'est plus à remettre.
    onSuccess: (_reponse, { statut }) => {
      void invalidate();
      toast.success(texteRemiseValidee({ statut }));
    },
    // Comme avant : notification rouge avec le texte du serveur, en plus du
    // cadre rouge de la fenêtre.
    onError: (e: Error) => {
      toast.error(e.message);
      void invalidate();
    },
  });
};
