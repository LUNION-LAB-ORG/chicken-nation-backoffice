import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { TABLEAU_LIVRAISON_CLE } from '../../courses/queries/tableau-livraison.query';
import {
  affecterCommande,
  retirerCommandeDeSaCourse,
  type ReponseGesteCommande,
} from '../../courses/services/course.service';
import { livreursKeys } from '../../livreurs/hook/use-livreurs';
import { terminerCommande } from '../services/operations-service';
import { useInvalidateOperationsQuery } from './index.query';

/**
 * Gestes du siège sur une commande (demande du 06/11). Réussite : le texte du
 * serveur ; refus : son texte aussi. Dans les deux cas, relecture de la liste
 * des Opérations, du détail et du suivi de la commande, des courses, des
 * livreurs et du tableau de la livraison.
 */
const useRelire = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOperationsQuery();
  return () => {
    void invalidate();
    void queryClient.invalidateQueries({ queryKey: TABLEAU_LIVRAISON_CLE });
    void queryClient.invalidateQueries({ queryKey: livreursKeys.all() });
    void queryClient.invalidateQueries({ queryKey: ['deliverers', 'live-locations'] });
  };
};

const annoncer = (reponse: ReponseGesteCommande) => {
  if (reponse.appli_connectee === false) toast(reponse.message, { icon: '⚠️', duration: 10000 });
  else toast.success(reponse.message);
};

export const useTerminerCommandeMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (orderId: string) => terminerCommande(orderId),
    onSuccess: (commande) => {
      toast.success(commande.status === 'COMPLETED' ? 'Commande terminée.' : 'Commande récupérée, à encaisser.');
      relire();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      relire();
    },
  });
};

export const useRetirerDeLaCourseMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: (orderId: string) => retirerCommandeDeSaCourse(orderId),
    onSuccess: (reponse) => {
      annoncer(reponse);
      relire();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      relire();
    },
  });
};

/** Le refus reste affiché dans la fenêtre du choix : le livreur peut en choisir un autre. */
export const useAffecterCommandeMutation = () => {
  const relire = useRelire();
  return useMutation({
    mutationFn: ({ orderId, delivererId }: { orderId: string; delivererId: string }) =>
      affecterCommande(orderId, delivererId),
    onSuccess: (reponse) => {
      annoncer(reponse);
      relire();
    },
    onError: () => relire(),
  });
};
