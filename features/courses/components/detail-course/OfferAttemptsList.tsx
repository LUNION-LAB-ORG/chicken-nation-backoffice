import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { CourseOfferAttempt } from '../../types/course.types';
import { OFFER_STATUS_CLASSES, OFFER_STATUS_LABELS, formatDelivererName } from '../../utils/course-labels';

interface Props {
  attempts: CourseOfferAttempt[];
}

/** Timeline des tentatives d'affectation (audit trail). */
export function OfferAttemptsList({ attempts }: Props) {
  if (attempts.length === 0) {
    return <p className="text-sm text-gray-400">Aucune tentative d&apos;affectation.</p>;
  }

  const sorted = [...attempts].sort(
    (a, b) => new Date(b.offered_at).getTime() - new Date(a.offered_at).getTime(),
  );

  return (
    <div className="space-y-2">
      {sorted.map((attempt) => (
        <div
          key={attempt.id}
          className="flex items-start gap-3 text-sm border-l-2 border-slate-200 pl-3 pb-2"
        >
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {formatDelivererName(attempt.deliverer)}
            </div>
            <div className="text-xs text-gray-500">
              Offerte le {format(new Date(attempt.offered_at), 'dd MMM yyyy HH:mm:ss', { locale: fr })}
            </div>
            {attempt.responded_at && (
              <div className="text-xs text-gray-500">
                Réponse le {format(new Date(attempt.responded_at), 'dd MMM yyyy HH:mm:ss', { locale: fr })}
              </div>
            )}
            {attempt.refusal_reason && (
              <div className="text-xs text-red-600 mt-0.5">Raison : {attempt.refusal_reason}</div>
            )}
          </div>
          <span
            className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${OFFER_STATUS_CLASSES[attempt.status]}`}
          >
            {OFFER_STATUS_LABELS[attempt.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
