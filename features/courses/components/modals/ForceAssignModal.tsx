'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';

import { useLivreursList } from '../../../livreurs/hook/use-livreurs';
import { formatDelivererName } from '../../utils/course-labels';
import { useCourseForceAssignMutation } from '../../queries/course-force-assign.mutation';
import type { Course } from '../../types/course.types';

interface Props {
  isOpen: boolean;
  course: Course;
}

/** Modal admin : forcer l'affectation d'un livreur précis à une course. */
export function ForceAssignModal({ isOpen, course }: Props) {
  const { toggleModal } = useDashboardStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useLivreursList(
    { status: 'ACTIVE', restaurant_id: course.restaurant_id, limit: 50 },
    isOpen,
  );
  const forceAssign = useCourseForceAssignMutation();

  const livreurs = data?.items ?? [];

  const handleClose = () => {
    toggleModal('courses', 'force_assign');
    setSelectedId(null);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    forceAssign.mutate(
      { id: course.id, payload: { deliverer_id: selectedId } },
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
        <p className="text-sm text-gray-600 mb-4">
          Référence {course.reference} — Restaurant {course.restaurant.name}
        </p>

        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
          {isLoading ? (
            <p className="p-4 text-sm text-gray-500">Chargement des livreurs…</p>
          ) : livreurs.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              Aucun livreur actif rattaché à ce restaurant.
            </p>
          ) : (
            <ul>
              {livreurs.map((livreur) => {
                const selected = selectedId === livreur.id;
                return (
                  <li key={livreur.id}>
                    <button
                      onClick={() => setSelectedId(livreur.id)}
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition ${
                        selected ? 'bg-orange-50 border-[#F17922]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {formatDelivererName(livreur)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {livreur.reference} · {livreur.phone}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || forceAssign.isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#F17922] text-white text-sm font-semibold disabled:bg-gray-300"
          >
            {forceAssign.isPending ? 'Envoi…' : 'Envoyer l\'offre'}
          </button>
        </div>
      </div>
    </div>
  );
}
