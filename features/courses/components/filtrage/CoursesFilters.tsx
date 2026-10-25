'use client';

import { useDashboardStore } from '@/store/dashboardStore';

import { useLivreursList } from '../../../livreurs/hook/use-livreurs';
import type { CourseStatut } from '../../types/course.types';
import { COURSE_STATUT_LABELS, formatDelivererName } from '../../utils/course-labels';
import {
  CLE_RESTAURANT_DU_LIVREUR,
  filtresCoursesActifs,
  livreurChoisiValable,
} from '../../utils/filtres-courses';

const STATUT_OPTIONS: CourseStatut[] = [
  'PENDING_ASSIGNMENT',
  'ACCEPTED',
  'AT_RESTAURANT',
  'IN_DELIVERY',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
];

/**
 * Filtres liste courses : statut + livreur + dates. Le restaurant est celui
 * du bandeau au-dessus (relecture du 25/10) : la liste des livreurs est
 * limitée à ce restaurant, et le livreur choisi est oublié quand le bandeau
 * change de restaurant.
 */
export function CoursesFilters() {
  const {
    courses: { filters },
    selectedRestaurantId,
    setFilter,
    resetFilters,
    setPagination,
  } = useDashboardStore();

  const { data: livreursData } = useLivreursList({
    status: 'ACTIVE',
    restaurant_id: selectedRestaurantId ?? undefined,
    limit: 100,
  });

  const livreurs = livreursData?.items ?? [];

  const handleChange = (key: string, value: unknown) => {
    setFilter('courses', key, value);
    setPagination('courses', 1, 10);
  };

  const handleLivreurChange = (id: string) => {
    setFilter('courses', 'deliverer_id', id || undefined);
    setFilter('courses', CLE_RESTAURANT_DU_LIVREUR, id ? (selectedRestaurantId ?? null) : undefined);
    setPagination('courses', 1, 10);
  };

  const handleReset = () => {
    resetFilters('courses');
    setPagination('courses', 1, 10);
  };

  const hasActiveFilters = filtresCoursesActifs(filters, selectedRestaurantId);
  const livreurChoisi = livreurChoisiValable(filters, selectedRestaurantId) ? (filters?.deliverer_id as string) : '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-4">
      <FilterSelect
        label="Statut"
        value={(filters?.statut as string) ?? ''}
        onChange={(v) => handleChange('statut', v || undefined)}
        placeholder="Tous les statuts"
        options={STATUT_OPTIONS.map((s) => ({ value: s, label: COURSE_STATUT_LABELS[s] }))}
      />

      <FilterSelect
        label="Livreur"
        value={livreurChoisi}
        onChange={handleLivreurChange}
        placeholder={selectedRestaurantId ? 'Tous les livreurs du resto' : 'Tous les livreurs'}
        options={livreurs.map((l) => ({ value: l.id, label: formatDelivererName(l) }))}
      />

      <FilterInput
        label="Du"
        type="date"
        value={(filters?.startDate as string) ?? ''}
        onChange={(v) => handleChange('startDate', v || undefined)}
      />

      <FilterInput
        label="Au"
        type="date"
        value={(filters?.endDate as string) ?? ''}
        onChange={(v) => handleChange('endDate', v || undefined)}
      />

      {hasActiveFilters && (
        <button onClick={handleReset} className="px-4 py-2 text-sm text-[#F17922] hover:underline">
          Réinitialiser
        </button>
      )}
    </div>
  );
}

// --- Primitives internes pour éviter la duplication ---

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, placeholder, options }: FilterSelectProps) {
  return (
    <div className="flex flex-col min-w-[200px]">
      <label className="text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
