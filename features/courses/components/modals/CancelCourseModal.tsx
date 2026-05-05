'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';

import { useCourseCancelMutation } from '../../queries/course-cancel.mutation';
import type { Course } from '../../types/course.types';

interface Props {
  isOpen: boolean;
  course: Course;
}

/** Modal admin : annuler une course (avec raison optionnelle). */
export function CancelCourseModal({ isOpen, course }: Props) {
  const { toggleModal, setSectionView } = useDashboardStore();
  const [reason, setReason] = useState('');
  const cancelMutation = useCourseCancelMutation();

  const handleClose = () => {
    toggleModal('courses', 'cancel');
    setReason('');
  };

  const handleConfirm = () => {
    cancelMutation.mutate(
      { id: course.id, payload: { reason: reason.trim() || undefined } },
      {
        onSuccess: () => {
          handleClose();
          setSectionView('courses', 'list');
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Annuler la course</h2>
        <p className="text-sm text-gray-600 mb-4">
          Référence {course.reference}. Cette action est <strong>irréversible</strong> et
          annulera toutes les livraisons restantes.
        </p>

        <label className="block text-xs font-medium text-gray-700 mb-1">
          Raison (optionnelle)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
          rows={3}
          placeholder="Ex: Restaurant fermé, commande erronée…"
          maxLength={500}
        />

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm"
          >
            Retour
          </button>
          <button
            onClick={handleConfirm}
            disabled={cancelMutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:bg-gray-300"
          >
            {cancelMutation.isPending ? 'Annulation…' : 'Confirmer l\'annulation'}
          </button>
        </div>
      </div>
    </div>
  );
}
