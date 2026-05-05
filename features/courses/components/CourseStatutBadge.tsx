import { COURSE_STATUT_CLASSES, COURSE_STATUT_LABELS } from '../utils/course-labels';
import type { CourseStatut } from '../types/course.types';

interface Props {
  statut: CourseStatut;
  size?: 'sm' | 'md';
}

/** Pastille colorée affichant le statut d'une Course. */
export function CourseStatutBadge({ statut, size = 'md' }: Props) {
  const sizeCls = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeCls} ${COURSE_STATUT_CLASSES[statut]}`}>
      {COURSE_STATUT_LABELS[statut]}
    </span>
  );
}
