'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, RotateCw, WifiOff } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

import { useLivreursList } from '../../../livreurs/hook/use-livreurs';
import { useMaintenant } from '../../../livreurs/hook/use-maintenant';
import {
  COULEURS_ETAT,
  LIBELLE_APPLI_NON_CONNECTEE,
  RAISON_APPLI_NON_CONNECTEE,
  appliNonConnectee,
  choixAffectation,
  comparerPourAffectation,
} from '../../../livreurs/utils/disponibilite';
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
 * « Appli non connectée » : le serveur ne voit pas la connexion temps réel de
 * l'appli de ce livreur. Il reste sélectionnable, mais l'offre ne lui
 * arrivera que par notification : l'admin le sait avant d'envoyer.
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
          const choix = choixAffectation(livreur.disponibilite, course.id, maintenant);
          return {
            livreur,
            nom: formatDelivererName(livreur),
            choix,
            sansAppli: choix.selectionnable && appliNonConnectee(livreur.appli_connectee, choix.etat),
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
            Les livreurs grisés ne peuvent pas recevoir d&apos;offre : en pause, en course, déjà sollicités
            ou hors service (pas encore repris dans l&apos;appli).
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
              {lignes.map(({ livreur, nom, choix, sansAppli }) => {
                const selected = choisi?.livreur.id === livreur.id;
                const couleurs = choix.etat ? COULEURS_ETAT[choix.etat] : null;
                return (
                  <li key={livreur.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(livreur.id)}
                      disabled={!choix.selectionnable}
                      aria-pressed={selected}
                      title={choix.raison ?? (sansAppli ? RAISON_APPLI_NON_CONNECTEE : undefined)}
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition flex items-center gap-3 ${
                        !choix.selectionnable
                          ? 'bg-gray-50 cursor-not-allowed'
                          : selected
                            ? 'bg-orange-50 border-[#F17922]'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex-1 min-w-0 ${choix.selectionnable ? '' : 'opacity-50'}`}>
                        <div className="text-sm font-medium text-gray-900 truncate">{nom}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {livreur.reference} · {livreur.phone}
                        </div>
                        {sansAppli && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                            <WifiOff className="w-3 h-3 shrink-0" />
                            {LIBELLE_APPLI_NON_CONNECTEE}
                          </div>
                        )}
                      </div>
                      {choix.libelle && couleurs && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: couleurs.fond, color: couleurs.texte }}
                        >
                          {choix.libelle}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {choisi?.sansAppli && !forceAssign.error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{RAISON_APPLI_NON_CONNECTEE}</span>
          </div>
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
