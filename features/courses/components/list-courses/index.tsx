'use client';

import { ErrorState, LoadingState, PaginationInfo } from '@/components/TableStates';

import type { CoursesListResponse } from '../../types/course.types';
import { CourseRow } from './CourseRow';
import { TableHeader } from './TableHeader';

interface Props {
  courses?: CoursesListResponse;
  isLoading: boolean;
  error: Error | null;
}

/** Liste paginée des courses (admin). */
export function CoursesTable({ courses, isLoading, error }: Props) {
  const items = courses?.items ?? [];

  if (isLoading && items.length === 0) return <LoadingState />;
  if (error && items.length === 0) return <ErrorState error={error} title="Erreur lors du chargement des courses" />;

  return (
    <div className="min-w-full bg-white min-h-[70vh] border border-slate-300 p-2 rounded-xl overflow-auto">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <TableHeader />
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-400 text-sm">
                  Aucune course trouvée
                </td>
              </tr>
            ) : (
              items.map((course) => <CourseRow key={course.id} course={course} />)
            )}
          </tbody>
        </table>
      </div>

      <PaginationInfo
        tabKey="courses"
        label="course"
        totalItems={courses?.total ?? 0}
        totalPages={courses?.totalPages ?? 1}
        isLoading={isLoading}
      />
    </div>
  );
}
