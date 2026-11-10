'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RotateCw, Send, Undo2, UserPlus, type LucideIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useDashboardStore } from '@/store/dashboardStore';

import { useDroitsLivraison } from '../../livreurs/hook/use-droits-livraison';
import { useSacRapporteMutation } from '../../operations/queries/sac-rapporte.mutation';
import { LIBELLE_SAC_RAPPORTE, peutRapporterSac } from '../../operations/utils/sac-a-rapporter';
import { useDroitsCommande } from '../../orders/hooks/useDroitsCommande';
import { useAuthStore } from '../../users/hook/authStore';
import { courseDetailQueryOption } from '../queries/course-detail.query';
import { useCourseRelancerMutation, useCourseVersTurboMutation } from '../queries/course-fleet.mutation';
import { useCourseRetryMutation } from '../queries/course-retry.mutation';
import { useRelanceLivraisonMutation } from '../queries/relance-livraison.mutation';
import type { SignalLivraison } from '../types/tableau-livraison.types';
import { LIBELLE_RELANCER_LIVRAISON, peutRelancerLivraison } from '../utils/relance-livraison';
import {
  actionsATraiter,
  relanceLivraisonDuSignal,
  sacRapporteDuSignal,
  type ActionATraiter,
} from '../utils/tableau-livraison';

/** Un bouton d'une alerte de « À traiter ». */
export interface GesteAlerte {
  cle: ActionATraiter | 'RELANCER_COMMANDE' | 'SAC_RAPPORTE';
  libelle: string;
  Icone: LucideIcon;
  /** Bouton plein (le geste attendu) ; sinon bordé. */
  principal: boolean;
  /** Envoi en cours pour cette ligne : l'icône tourne. */
  occupe: boolean;
  desactive: boolean;
  agir: () => void;
}

const LIBELLES: Record<ActionATraiter, string> = {
  FORCER: "Forcer l'affectation",
  TURBO: 'Confier à Turbo',
  RELANCER_RECHERCHE: 'Relancer la recherche',
  RELANCER_LIVRAISON: 'Relancer la livraison',
};

const ICONES: Record<ActionATraiter, LucideIcon> = {
  FORCER: UserPlus,
  TURBO: Send,
  RELANCER_RECHERCHE: RotateCw,
  RELANCER_LIVRAISON: RotateCw,
};

/**
 * Gestes de « À traiter » (conception du 24/10, 10.1, puis 28/10), sortis de
 * l'ancien bloc de l'écran Courses quand « À traiter » est devenu unique sur
 * la Carte live (10/11). Mêmes droits, mêmes gestes :
 *
 *  - qui pilote les courses (administrateur) : « Forcer l'affectation » et
 *    « Confier à Turbo » sur une recherche en cours, « Relancer la recherche »
 *    quand elle est finie, « Relancer la livraison » sur une course annulée ;
 *  - « Relancer la livraison » d'une commande annulée par le livreur
 *    (administrateur, centre d'appels) et « Sac rapporté » (rôles admis par
 *    le serveur), quand l'alerte porte une seule commande.
 *
 * « Forcer l'affectation » ouvre la fenêtre des courses (`force_assign`) :
 * l'écran qui affiche les gestes la monte.
 */
export function useGestesAlerte(): (s: SignalLivraison) => GesteAlerte[] {
  const setSelectedItem = useDashboardStore((s) => s.setSelectedItem);
  const toggleModal = useDashboardStore((s) => s.toggleModal);
  const droitsLivraison = useDroitsLivraison();
  const { piloterCourses } = droitsLivraison;
  const peutRelancer = peutRelancerLivraison(droitsLivraison);
  const { peutChangerStatut } = useDroitsCommande();
  const membre = useAuthStore((s) => s.user);
  const peutRapporter = peutRapporterSac(peutChangerStatut, membre);
  const queryClient = useQueryClient();
  const [ouverture, setOuverture] = useState<string | null>(null);

  const { mutate: versTurbo, isPending: envoiTurbo, variables: turboId } = useCourseVersTurboMutation();
  const { mutate: relancerRecherche, isPending: relanceRecherche, variables: rechercheId } = useCourseRetryMutation();
  const { mutate: relancerLivraison, isPending: relanceLivraison, variables: livraisonId } =
    useCourseRelancerMutation();
  const { mutate: rapporterSac, isPending: envoiSac, variables: sacEnvoye } = useSacRapporteMutation();
  const { mutate: relancerCommande, isPending: envoiRelance, variables: relanceEnvoyee } =
    useRelanceLivraisonMutation();
  // Un seul envoi à la fois entre « Relancer la livraison » et « Sac rapporté ».
  const envoiGeste = envoiSac || envoiRelance;

  // La fenêtre « Forcer l'affectation » lit la course entière (restaurant, livreurs du restaurant).
  const forcer = useCallback(
    async (courseId: string) => {
      setOuverture(courseId);
      try {
        const course = await queryClient.fetchQuery(courseDetailQueryOption(courseId));
        setSelectedItem('courses', course);
        if (!useDashboardStore.getState().courses.modals?.force_assign) toggleModal('courses', 'force_assign');
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setOuverture(null);
      }
    },
    [queryClient, setSelectedItem, toggleModal],
  );

  return useCallback(
    (s: SignalLivraison): GesteAlerte[] => {
      const gestes: GesteAlerte[] = [];
      const courseId = s.course?.id;
      if (courseId && piloterCourses) {
        for (const action of actionsATraiter(s)) {
          const occupe =
            action === 'FORCER'
              ? ouverture === courseId
              : action === 'TURBO'
                ? envoiTurbo && turboId === courseId
                : action === 'RELANCER_RECHERCHE'
                  ? relanceRecherche && rechercheId === courseId
                  : relanceLivraison && livraisonId === courseId;
          gestes.push({
            cle: action,
            libelle: LIBELLES[action],
            Icone: ICONES[action],
            principal: action === 'FORCER',
            occupe,
            desactive: occupe,
            agir: () => {
              if (action === 'FORCER') void forcer(courseId);
              else if (action === 'TURBO') versTurbo(courseId);
              else if (action === 'RELANCER_RECHERCHE') relancerRecherche(courseId);
              else relancerLivraison(courseId);
            },
          });
        }
      }
      const reference = s.commandes[0] ?? null;
      const relanceId = peutRelancer ? relanceLivraisonDuSignal(s) : null;
      if (relanceId) {
        gestes.push({
          cle: 'RELANCER_COMMANDE',
          libelle: LIBELLE_RELANCER_LIVRAISON,
          Icone: RotateCw,
          principal: false,
          occupe: envoiRelance && relanceEnvoyee?.orderId === relanceId,
          desactive: envoiGeste,
          agir: () => relancerCommande({ orderId: relanceId, reference }),
        });
      }
      const sacId = peutRapporter ? sacRapporteDuSignal(s) : null;
      if (sacId) {
        gestes.push({
          cle: 'SAC_RAPPORTE',
          libelle: LIBELLE_SAC_RAPPORTE,
          Icone: Undo2,
          principal: false,
          occupe: envoiSac && sacEnvoye?.orderId === sacId,
          desactive: envoiGeste,
          agir: () => rapporterSac({ orderId: sacId, reference }),
        });
      }
      return gestes;
    },
    [
      piloterCourses,
      peutRelancer,
      peutRapporter,
      ouverture,
      envoiTurbo,
      turboId,
      relanceRecherche,
      rechercheId,
      relanceLivraison,
      livraisonId,
      envoiRelance,
      relanceEnvoyee,
      envoiSac,
      sacEnvoye,
      envoiGeste,
      forcer,
      versTurbo,
      relancerRecherche,
      relancerLivraison,
      relancerCommande,
      rapporterSac,
    ],
  );
}
