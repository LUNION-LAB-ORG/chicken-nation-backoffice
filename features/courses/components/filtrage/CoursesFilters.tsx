'use client';

import { useDashboardStore } from '@/store/dashboardStore';

import { useLivreursList } from '../../../livreurs/hook/use-livreurs';
import { useRestaurantListQuery } from '../../../restaurants/queries/restaurant-list.query';
import type { CourseStatut } from '../../types/course.types';
import { COURSE_STATUT_LABELS, formatDelivererName } from '../../utils/course-labels';

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
 * Filtres liste courses : statut + restaurant + livreur + dates.
 * Quand un restaurant est sélectionné, la liste des livreurs est scopée à ce resto.
 */
export function CoursesFilters() {
  const {
    courses: { filters },
    setFilter,
    resetFilters,
    setPagination,
  } = useDashboardStore();

  const restaurantId = filters?.restaurant_id as string | undefined;
  const { data: restaurantsData } = useRestaurantListQuery({ limit: 100 });
  const { data: livreursData } = useLivreursList({
    status: 'ACTIVE',
    restaurant_id: restaurantId,
    limit: 100,
  });

  const restaurants = restaurantsData?.data ?? [];
  const livreurs = livreursData?.items ?? [];

  const handleChange = (key: string, value: unknown) => {
    setFilter('courses', key, value);
    setPagination('courses', 1, 10);
  };

  const handleRestaurantChange = (id: string) => {
    setFilter('courses', 'restaurant_id', id || undefined);
    // Reset livreur si on change de resto
    setFilter('courses', 'deliverer_id', undefined);
    setPagination('courses', 1, 10);
  };

  const handleReset = () => {
    resetFilters('courses');
    setPagination('courses', 1, 10);
  };

  const hasActiveFilters = !!(
    filters?.statut ||
    filters?.restaurant_id ||
    filters?.deliverer_id ||
    filters?.startDate ||
    filters?.endDate
  );

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
        label="Restaurant"
        value={restaurantId ?? ''}
        onChange={handleRestaurantChange}
        placeholder="Tous les restaurants"
        options={restaurants.map((r) => ({ value: r.id, label: r.name }))}
      />

      <FilterSelect
        label="Livreur"
        value={(filters?.deliverer_id as string) ?? ''}
        onChange={(v) => handleChange('deliverer_id', v || undefined)}
        placeholder={restaurantId ? 'Tous les livreurs du resto' : 'Tous les livreurs'}
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
