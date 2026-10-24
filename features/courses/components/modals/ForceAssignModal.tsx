'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

import { useLivreursList } from '../../../livreurs/hook/use-livreurs';
import { useMaintenant } from '../../../livreurs/hook/use-maintenant';
import {
  COULEURS_ETAT,
  COULEURS_PRESENCE,
  appliActiveDe,
  choixAffectation,
  comparerPourAffectation,
  presenceAppli,
  type PresenceAppli,
} from '../../../livreurs/utils/disponibilite';
import { ICONE_PRESENCE, PresenceAppliLigne } from '../../../livreurs/components/PresenceAppliLigne';
import { formatDelivererName } from '../../utils/course-labels';
import { useCourseForceAssignMutation } from '../../queries/course-force-assign.mutation';
import type { Course } from '../../types/course.types';

interface Props {
  isOpen: boolean;
  course: Course;
}

/**
 * Modal admin : forcer l'affectation d'un livreur précis à une course.
 *
 * Chaque livreur porte son état, calculé par le serveur avec la règle qui
 * décide des offres : seuls les livreurs disponibles (ou qui ont déjà l'offre
 * de cette course, renvoyée) peuvent être choisis ; les autres sont grisés
 * avec leur raison. L'état est relu à l'ouverture, toutes les 15 s et après
 * un refus ; le refus du serveur est affiché tel quel.
 *
 * L'appli du livreur (demande du 24/10) :
 *  - « Appli fermée » : grisé comme les autres refus, avec le texte du
 *    serveur affiché tel quel et l'heure du dernier signal (« vue il y a
 *    6 min ») ; il redevient sélectionnable dès qu'il rouvre l'appli ;
 *  - « En arrière-plan » (ou « Appli non connectée » avec un serveur plus
 *    ancien) : sans connexion temps réel. Il reste sélectionnable, mais
 *    l'offre lui arrivera par notification : l'admin le sait avant d'envoyer.
 */
export function ForceAssignModal({ isOpen, course }: Props) {
  const { toggleModal } = useDashboardStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const maintenant = useMaintenant(10 * 1000, isOpen);

  const { data, isLoading, isFetching, refetch } = useLivreursList(
    { status: 'ACTIVE', restaurant_id: course.restaurant_id, limit: 50 },
    isOpen,
    { staleTime: 0, refetchInterval: 15 * 1000 },
  );
  const forceAssign = useCourseForceAssignMutation();

  const lignes = useMemo(
    () =>
      (data?.items ?? [])
        .map((livreur) => {
          const choix = choixAffectation(livreur.disponibilite, course.id, maintenant, appliActiveDe(livreur));
          const presence = presenceAppli(livreur, choix.etat, maintenant);
          return {
            livreur,
            nom: formatDelivererName(livreur),
            choix,
            // Grisé pour une autre raison (en course ailleurs…) : la raison du serveur suffit.
            presence: choix.selectionnable || choix.etat === 'APPLI_FERMEE' ? presence : null,
          };
        })
        .sort(comparerPourAffectation),
    [data, course.id, maintenant],
  );

  // Un livreur choisi qui vient de passer en pause (ou en course) n'est plus choisi.
  const choisi = lignes.find((l) => l.livreur.id === selectedId && l.choix.selectionnable) ?? null;
  const nbSelectionnables = lignes.filter((l) => l.choix.selectionnable).length;

  const handleClose = () => {
    toggleModal('courses', 'force_assign');
    setSelectedId(null);
    forceAssign.reset();
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    forceAssign.reset();
  };

  const handleConfirm = () => {
    if (!choisi) return;
    forceAssign.mutate(
      { id: course.id, payload: { deliverer_id: choisi.livreur.id } },
      { onSuccess: () => handleClose() },
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Affecter un livreur à la course
        </h2>
        <p className="text-sm text-gray-600">
          Référence {course.reference} · Restaurant {course.restaurant.name}
        </p>

        <div className="flex items-center justify-between gap-3 mt-3 mb-2">
          <p className="text-xs text-gray-500">
            {isLoading || lignes.length === 0
              ? ''
              : nbSelectionnables === 0
                ? "Aucun livreur ne peut recevoir l'offre pour le moment."
                : nbSelectionnables === 1
                  ? `1 livreur sur ${lignes.length} peut recevoir l'offre.`
                  : `${nbSelectionnables} livreurs sur ${lignes.length} peuvent recevoir l'offre.`}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#F17922] hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            <RotateCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
        {lignes.length > 0 && nbSelectionnables < lignes.length && (
          <p className="text-xs text-gray-500 mb-2">
            Les livreurs grisés ne peuvent pas recevoir d&apos;offre : en pause, en course, déjà sollicités,
            hors service (pas encore repris dans l&apos;appli) ou appli fermée.
          </p>
        )}

        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
          {isLoading ? (
            <p className="p-4 text-sm text-gray-500">Chargement des livreurs…</p>
          ) : lignes.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              Aucun livreur actif rattaché à ce restaurant.
            </p>
          ) : (
            <ul>
              {lignes.map(({ livreur, nom, choix, presence }) => {
                const selected = choisi?.livreur.id === livreur.id;
                const couleurs = choix.etat ? COULEURS_ETAT[choix.etat] : null;
                const fermee = choix.etat === 'APPLI_FERMEE';
                const IconeFermee = ICONE_PRESENCE.FERMEE;
                return (
                  <li key={livreur.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(livreur.id)}
                      disabled={!choix.selectionnable}
                      aria-pressed={selected}
                      title={choix.raison ?? presence?.raison}
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition flex items-center gap-3 ${
                        !choix.selectionnable
                          ? 'bg-gray-50 cursor-not-allowed'
                          : selected
                            ? 'bg-orange-50 border-[#F17922]'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={choix.selectionnable ? '' : 'opacity-50'}>
                          <div className="text-sm font-medium text-gray-900 truncate">{nom}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {livreur.reference} · {livreur.phone}
                          </div>
                        </div>
                        {fermee && choix.raison ? (
                          // Refus du serveur, tel quel.
                          <div
                            className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold"
                            style={{ color: COULEURS_PRESENCE.FERMEE.texte }}
                          >
                            <IconeFermee className="w-3 h-3 shrink-0" aria-hidden />
                            <span className="truncate">{choix.raison}</span>
                          </div>
                        ) : (
                          presence && <PresenceAppliLigne presence={presence} className="mt-0.5" />
                        )}
                      </div>
                      {choix.libelle && couleurs && (
                        <div className="shrink-0 flex flex-col items-end gap-0.5">
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: couleurs.fond, color: couleurs.texte }}
                          >
                            {choix.libelle}
                          </span>
                          {fermee && presence?.vue && (
                            <span className="text-[10px] text-gray-500">{presence.vue}</span>
                          )}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {choisi?.presence && !forceAssign.error && (
          <ExplicationPresence presence={choisi.presence} />
        )}

        {forceAssign.error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{forceAssign.error.message}</span>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!choisi || forceAssign.isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#F17922] text-white text-sm font-semibold disabled:bg-gray-300"
          >
            {forceAssign.isPending
              ? 'Envoi…'
              : choisi?.choix.renvoi
                ? 'Renvoyer l\'offre'
                : 'Envoyer l\'offre'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Avant l'envoi : pourquoi l'offre arrivera par notification à ce livreur. */
function ExplicationPresence({ presence }: { presence: PresenceAppli }) {
  const Icone = ICONE_PRESENCE[presence.cas];
  const c = COULEURS_PRESENCE[presence.cas];
  return (
    <div
      className="mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
      style={{ backgroundColor: c.fond, borderColor: c.bord, color: c.texte }}
    >
      <Icone className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
      <span>{presence.raison}</span>
    </div>
  );
}
