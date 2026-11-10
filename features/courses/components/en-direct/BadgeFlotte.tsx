'use client';

import { RotateCcw, Send } from 'lucide-react';
import React, { useState } from 'react';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useDroitsLivraison } from '../../../livreurs/hook/use-droits-livraison';
import { useCourseVersInterneMutation, useCourseVersTurboMutation } from '../../queries/course-fleet.mutation';
import type { CourseEnDirect } from '../../types/en-direct.types';
import { basculeFlotte } from '../../utils/en-direct';

/**
 * BADGE TURBO QUI AGIT (retour du 10/11 : « les badges et les boutons font
 * des actions rapides »). Tant que personne n'a pris la course :
 *  - course chez Turbo : « Turbo · Reprendre en interne » ;
 *  - notre course en recherche : « Confier à Turbo ».
 * Un toucher, puis « Oui » : la question dit ce qui va se passer, car Turbo
 * est prévenu. Le serveur refuse en clair si un livreur l'a prise entre-temps.
 *
 * Sans geste possible (livreur trouvé, compte qui ne pilote pas les courses) :
 * le badge « Turbo » seul, ou rien.
 */
export function BadgeFlotte({ course }: { course: CourseEnDirect }) {
  const { piloterCourses } = useDroitsLivraison();
  const [question, setQuestion] = useState(false);
  const versTurbo = useCourseVersTurboMutation();
  const versInterne = useCourseVersInterneMutation();
  const bascule = piloterCourses ? basculeFlotte(course) : null;
  const envoi = versTurbo.isPending || versInterne.isPending;

  if (!bascule) {
    return course.turbo ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
        <Send className="h-3 w-3" />
        Turbo
      </span>
    ) : null;
  }

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const versInterneDemande = bascule === 'VERS_INTERNE';

  if (question) {
    return (
      <div onClick={stop} onKeyDown={stop} className="w-full rounded-lg bg-[#FAFAFA] p-2 text-[11px] leading-4 text-[#52525B]">
        <p>
          {versInterneDemande
            ? 'Reprendre pour nos livreurs ? Turbo arrête sa recherche.'
            : 'Confier à Turbo ? Notre recherche de livreur s’arrête.'}
        </p>
        <div className="mt-1.5 flex gap-1.5">
          <button
            type="button"
            disabled={envoi}
            onClick={() =>
              (versInterneDemande ? versInterne : versTurbo).mutate(course.id, { onSettled: () => setQuestion(false) })
            }
            className="h-7 rounded-lg bg-[#F17922] px-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {envoi ? 'Envoi…' : 'Oui'}
          </button>
          <button
            type="button"
            onClick={() => setQuestion(false)}
            className="h-7 rounded-lg border border-[#E4E4E7] bg-white px-2.5 font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setQuestion(true);
      }}
      onKeyDown={stop}
      className={
        versInterneDemande
          ? 'inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100'
          : 'inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-50'
      }
    >
      {versInterneDemande ? <RotateCcw className="h-3 w-3" /> : <Send className="h-3 w-3" />}
      {versInterneDemande ? 'Turbo · Reprendre en interne' : 'Confier à Turbo'}
    </button>
  );
}

export default BadgeFlotte;
