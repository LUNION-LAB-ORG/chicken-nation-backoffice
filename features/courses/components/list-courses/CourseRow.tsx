'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowRight, MoreVertical, RotateCw, User } from 'lucide-react';
import React from 'react';
import { useDashboardStore } from '@/store/dashboardStore';

import { useCourseRetryMutation } from '../../queries/course-retry.mutation';
import type { Course } from '../../types/course.types';
import { formatDelivererName } from '../../utils/course-labels';
import { CourseStatutBadge } from '../CourseStatutBadge';

interface Props {
  course: Course;
}

/** Ligne de tableau enrichie : progress bar deliveries, avatar livreur, action rapide retry. */
export function CourseRow({ course }: Props) {
  const { setSectionView, setSelectedItem, toggleModal } = useDashboardStore();
  const { mutate: retryCourse, isPending: isRetrying } = useCourseRetryMutation();

  const deliveriesCount = course.deliveries.length;
  const terminal = course.deliveries.filter(
    (d) => d.statut === 'DELIVERED' || d.statut === 'FAILED' || d.statut === 'CANCELLED',
  ).length;
  const progressPct = deliveriesCount > 0 ? Math.round((terminal / deliveriesCount) * 100) : 0;
  const delivererName = formatDelivererName(course.deliverer);
  const delivererInitials = getInitials(delivererName);

  const handleOpenDetail = () => {
    setSelectedItem('courses', course);
    setSectionView('courses', 'view');
  };

  const handleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem('courses', course);
    if (!course.deliverer_id) {
      toggleModal('courses', 'force_assign');
    } else {
      toggleModal('courses', 'cancel');
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    retryCourse(course.id);
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-orange-50/40 cursor-pointer text-sm group" onClick={handleOpenDetail}>
      <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
        <div>{course.reference}</div>
        <div className="text-[10px] text-gray-400">
          {format(new Date(course.created_at), 'dd MMM · HH:mm', { locale: fr })}
        </div>
      </td>

      <td className="px-3 py-3">
        <span className="inline-flex items-center justify-center h-9 w-14 bg-orange-50 border border-orange-200 rounded-lg font-mono text-base font-bold text-[#F17922]">
          {course.pickup_code}
        </span>
      </td>

      <td className="px-3 py-3 text-gray-700">{course.restaurant.name}</td>

      <td className="px-3 py-3">
        {course.deliverer_id ? (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold items-center justify-center flex shrink-0">
              {delivererInitials || <User className="w-3 h-3" />}
            </div>
            <span className="text-gray-700 text-xs">{delivererName}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Non assigné</span>
        )}
      </td>

      <td className="px-3 py-3">
        <DeliveriesProgress terminal={terminal} total={deliveriesCount} pct={progressPct} />
      </td>

      <td className="px-3 py-3">
        <CourseStatutBadge statut={course.statut} />
      </td>

      <td className="px-3 py-3 text-gray-900 font-semibold whitespace-nowrap">
        {course.total_delivery_fee.toLocaleString('fr-FR')} F
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          {course.statut === 'EXPIRED' && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              title="Relancer la recherche"
              className="p-1.5 rounded hover:bg-green-50 text-green-600 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button onClick={handleMenu} title="Actions" className="p-1.5 rounded hover:bg-gray-200">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#F17922] transition-colors" />
        </div>
      </td>
    </tr>
  );
}

function DeliveriesProgress({ terminal, total, pct }: { terminal: number; total: number; pct: number }) {
  const barColor = pct === 100 ? '#4FCB71' : '#F17922';
  return (
    <div className="min-w-[130px]">
      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
        <span>{terminal}/{total} livraison{total > 1 ? 's' : ''}</span>
        <span className="font-semibold" style={{ color: barColor }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
